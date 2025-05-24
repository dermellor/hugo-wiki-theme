// Alpine.js Komponenten für Supabase Integration

// Alpine.js Data und Init für Supabase Auth
document.addEventListener('alpine:init', () => {
  // Auth-Komponente für Login-Status und Benutzerprofile
  Alpine.data('supabaseAuth', function() {
    return {
      session: null,
      user: null,
      displayName: 'Gast',
      isLoading: false,
      isSocialLoginLoading: false, // Für Social-Login-Buttons
      socialLoginProvider: null, // Welcher Provider wird gerade geladen
      showLoginModal: false,
      showDisplayNameModal: false,
      loginError: null,
      successMessage: null,
      email: '', // Wichtig für Login-Formulare
      
      // Bei Initialisierung Sitzungsstatus abrufen
      init() {
        this.checkSession();

        // Event-Listener für Auth-Änderungen
        supabaseClient.auth.onAuthStateChange((event, session) => {
          this.session = session;

          if (session) {
            this.loadUserProfile();
          } else {
            this.user = null;
            this.displayName = 'Gast';
          }
        });

        // Für das Display-Name-Modal: Event-Listener für den Fokus
        const displayNameModal = document.getElementById('display-name-modal');
        if (displayNameModal) {
          displayNameModal.addEventListener('shown.bs.modal', () => {
            // Display Name aus den Metadaten des Users verwenden, falls vorhanden
            if (this.user?.user_metadata?.display_name) {
              this.displayName = this.user.user_metadata.display_name;
            } else if (this.user?.email) {
              // Fallback zur E-Mail-Adresse, falls kein Display Name in den Metadaten
              this.displayName = this.user.email.split('@')[0];
            }

            // Auf das Eingabefeld fokussieren und Text auswählen
            const input = document.getElementById('display-name-input');
            if (input) {
              input.focus();
              input.select();
            }
          });
        }
      },
      
      // Aktuelle Sitzung prüfen
      async checkSession() {
        this.isLoading = true;
        
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          this.session = session;
          
          if (session) {
            this.loadUserProfile();
          }
        } catch (error) {
          console.error('Fehler beim Abrufen der Sitzung:', error);
        } finally {
          this.isLoading = false;
        }
      },
      
      // Benutzerprofil laden
      async loadUserProfile() {
        if (!this.session) return;
        
        try {
          // User-Daten abrufen
          const { data: { user } } = await supabaseClient.auth.getUser();
          this.user = user;
          
          // Display Name aus Profil-Tabelle abrufen
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          
          if (!error && profile && profile.display_name) {
            this.displayName = profile.display_name;
          } else {
            // Kein Display Name gefunden, Modal später anzeigen
            this.displayName = user.email || 'Anonymer Nutzer';
            
            // Display Name Modal anzeigen (mit kleiner Verzögerung für UX)
            setTimeout(() => {
              this.checkDisplayName();
            }, 1000);
          }
        } catch (error) {
          console.error('Fehler beim Laden des Benutzerprofils:', error);
        }
      },
      
      // Prüfen, ob Display Name gesetzt werden muss
      async checkDisplayName() {
        if (!this.user) return;
        
        // Profil und Display Name aus der profiles-Tabelle abrufen
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('id', this.user.id)
          .single();
        
        // Wenn kein Profil mit Display Name existiert, Modal anzeigen
        if (error || !profile || !profile.display_name) {
          this.showDisplayNameModal = true;
        }
      },
      
      // Display Name speichern
      async saveDisplayName(displayName) {
        if (!this.user || !displayName) {
          this.loginError = 'Bitte gib einen Display Namen ein (mindestens 2 Zeichen).';
          return false;
        }

        this.isLoading = true;
        this.loginError = null;
        this.successMessage = null;

        try {
          // Profil erstellen oder aktualisieren
          const { data: existingProfile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', this.user.id)
            .single();

          if (existingProfile) {
            // Bestehendes Profil aktualisieren
            const { error: updateError } = await supabaseClient
              .from('profiles')
              .update({ display_name: displayName })
              .eq('id', this.user.id);

            if (updateError) throw updateError;
          } else {
            // Neues Profil anlegen
            const { error: insertError } = await supabaseClient
              .from('profiles')
              .insert([{ id: this.user.id, display_name: displayName }]);

            if (insertError) throw insertError;
          }

          // Display Name aktualisieren
          this.displayName = displayName;
          this.successMessage = "Display Name erfolgreich gespeichert!";

          // Modal nach 2 Sekunden schließen
          setTimeout(() => {
            // Erst nach der Anzeige der Erfolgsmeldung Modal-Flag zurücksetzen
            this.showDisplayNameModal = false;

            const modal = bootstrap.Modal.getInstance(document.getElementById('display-name-modal'));
            if (modal) {
              modal.hide();
            }
          }, 2000);

          return true;
        } catch (error) {
          console.error('Fehler beim Speichern des Display Names:', error);
          this.loginError = 'Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler');
          return false;
        } finally {
          this.isLoading = false;
        }
      },
      
      // Email Login
      async loginWithEmail(email) {
        if (!email || !email.includes('@')) {
          this.loginError = 'Bitte gib eine gültige E-Mail-Adresse ein.';
          return false;
        }
        
        this.loginError = null;
        this.successMessage = null;
        this.isLoading = true;
        
        try {
          // Aktuelle URL für Redirect
          const currentUrl = window.location.href;
          
          const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
              emailRedirectTo: currentUrl
            }
          });
          
          if (error) throw error;

          // Erfolgsmeldung setzen
          this.successMessage = 'Link wurde gesendet! Bitte prüfe deinen E-Mail-Eingang.';
          this.email = ''; // E-Mail-Feld zurücksetzen

          // Event auslösen für externe Handler
          document.dispatchEvent(new CustomEvent('login-success', {
            detail: { email }
          }));

          return true;
        } catch (error) {
          console.error('Login-Fehler:', error);
          this.loginError = error.message || 'Fehler bei der Anmeldung';
          
          // Event auslösen für externe Handler
          document.dispatchEvent(new CustomEvent('login-error', {
            detail: { error }
          }));
          
          return false;
        } finally {
          this.isLoading = false;
        }
      },
      
      // Social Login
      async loginWithProvider(provider) {
        this.loginError = null;
        this.successMessage = null;

        // Status für UI-Feedback setzen
        this.isSocialLoginLoading = true;
        this.socialLoginProvider = provider;

        try {
          // Aktuelle URL für Redirect
          const currentUrl = window.location.href;

          const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
              redirectTo: currentUrl
            }
          });

          if (error) throw error;

          // Redirect erfolgt automatisch durch Supabase
          return true;
        } catch (error) {
          console.error(`${provider} Login-Fehler:`, error);
          this.loginError = error.message || `Fehler bei der Anmeldung mit ${provider}`;

          // Event auslösen für externe Handler
          document.dispatchEvent(new CustomEvent('login-error', {
            detail: { provider, error }
          }));

          // Status zurücksetzen
          this.isSocialLoginLoading = false;
          this.socialLoginProvider = null;

          return false;
        }
      },
      
      // Abmelden
      async logout(e) {
        if (e) e.preventDefault();
        
        try {
          await supabaseClient.auth.signOut();
          return true;
        } catch (error) {
          console.error('Logout-Fehler:', error);
          return false;
        }
      }
    };
  });
  
  // Kommentar-Komponente
  Alpine.data('comments', function() {
    return {
      comments: [],
      isLoading: false,
      commentText: '',
      errorMessage: null,
      successMessage: null,
      
      // Bei Initialisierung Kommentare laden
      init() {
        this.loadComments();
      },
      
      // Kommentare für aktuelle Seite laden
      async loadComments() {
        this.isLoading = true;
        this.errorMessage = null;
        
        try {
          const page = window.location.pathname;
          
          // Benutzer-ID für Filterung
          let currentUserId = null;
          if (Alpine.store('auth') && Alpine.store('auth').user) {
            currentUserId = Alpine.store('auth').user.id;
          }
          
          // Kommentare abrufen
          let query = supabaseClient
            .from('comments')
            .select(`
              id,
              content,
              created_at,
              author_id,
              published
            `)
            .eq('page', page);
          
          // Filter basierend auf Anmeldestatus
          if (currentUserId) {
            // Wenn Benutzer eingeloggt, zeige veröffentlichte Kommentare oder eigene
            query = query.or(`published.eq.true,author_id.eq.${currentUserId}`);
          } else {
            // Wenn Benutzer nicht eingeloggt, zeige nur veröffentlichte Kommentare
            query = query.eq('published', true);
          }
          
          // Abfrage ausführen
          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          
          // Wenn Kommentare gefunden wurden, Autoreninformationen laden
          if (data && data.length > 0) {
            this.comments = data;
            await this.loadCommentAuthors();
          } else {
            this.comments = [];
          }
        } catch (error) {
          console.error('Fehler beim Laden der Kommentare:', error);
          this.errorMessage = 'Kommentare konnten nicht geladen werden.';
        } finally {
          this.isLoading = false;
        }
      },
      
      // Autoren-Informationen für alle Kommentare laden
      async loadCommentAuthors() {
        try {
          // Eindeutige Autoren-IDs sammeln
          const authorIds = [...new Set(this.comments.map(comment => comment.author_id).filter(id => id))];
          
          if (authorIds.length === 0) return;
          
          // Profile abrufen
          const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('id, display_name')
            .in('id', authorIds);
          
          if (error) throw error;
          
          // Lookup-Map erstellen
          const displayNames = {};
          
          if (profiles) {
            profiles.forEach(profile => {
              displayNames[profile.id] = profile.display_name || 'Anonymer Nutzer';
            });
          }
          
          // Fehlende Autoren mit Fallback
          authorIds.forEach(id => {
            if (!displayNames[id]) {
              displayNames[id] = 'Anonymer Nutzer';
            }
          });
          
          // Kommentare mit Autorennamen anreichern
          this.comments = this.comments.map(comment => ({
            ...comment,
            authorName: displayNames[comment.author_id] || 'Anonymer Nutzer'
          }));
        } catch (error) {
          console.error('Fehler beim Laden der Autorennamen:', error);
        }
      },
      
      // Neuen Kommentar speichern
      async submitComment() {
        if (!this.commentText.trim()) {
          this.errorMessage = 'Bitte gib einen Kommentar ein.';
          return;
        }
        
        // Ist Benutzer angemeldet?
        if (!Alpine.store('auth') || !Alpine.store('auth').session) {
          this.errorMessage = 'Du musst angemeldet sein, um kommentieren zu können.';
          return;
        }
        
        this.isLoading = true;
        this.errorMessage = null;
        this.successMessage = null;
        
        try {
          const page = window.location.pathname;
          const author_id = Alpine.store('auth').user.id;
          
          // Kommentar speichern
          const { error } = await supabaseClient
            .from('comments')
            .insert([{
              content: this.commentText.trim(),
              page,
              author_id,
              published: false // Nicht veröffentlicht, bis geprüft
            }]);
          
          if (error) throw error;
          
          // Erfolgsmeldung
          this.successMessage = 'Kommentar wurde gespeichert und wird nach Prüfung veröffentlicht.';
          this.commentText = '';
          
          // Kommentare neu laden
          await this.loadComments();
        } catch (error) {
          console.error('Fehler beim Speichern des Kommentars:', error);
          this.errorMessage = 'Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler');
        } finally {
          this.isLoading = false;
        }
      },
      
      // Zeitstempel formatieren
      formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    };
  });
});

// Alpine.js Store für app-weite Statusverwaltung
document.addEventListener('alpine:init', () => {
  Alpine.store('auth', {
    session: null,
    user: null,
    displayName: null,
    
    async init() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.session = session;
        
        if (session) {
          const { data: { user } } = await supabaseClient.auth.getUser();
          this.user = user;
          
          // Display Name aus Profil-Tabelle abrufen
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            this.displayName = profile.display_name;
          }
        }
      } catch (error) {
        console.error('Auth-Store Initialisierungsfehler:', error);
      }
      
      // Auf Auth-Änderungen reagieren
      supabaseClient.auth.onAuthStateChange((event, session) => {
        this.session = session;
        
        if (session) {
          this.loadUser();
        } else {
          this.user = null;
          this.displayName = null;
        }
      });
    },
    
    async loadUser() {
      if (!this.session) return;
      
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        this.user = user;
        
        // Display Name aus Profil-Tabelle abrufen
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          this.displayName = profile.display_name;
        }
      } catch (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
      }
    }
  });
});

// Alpine.js Store initialisieren
document.addEventListener('DOMContentLoaded', () => {
  if (Alpine.store('auth')) {
    Alpine.store('auth').init();
  }
});