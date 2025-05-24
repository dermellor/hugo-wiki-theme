// Alpine.js Stores und Komponenten für Supabase Integration
// HINWEIS: Die Hauptimplementierung befindet sich jetzt in alpineComponents.js
// Dieser Store dient nur noch als Legacy-Wrapper für Kompatibilität

document.addEventListener('alpine:init', () => {
  // Auth Store für globalen Anmeldestatus
  Alpine.store('auth', {
    session: null,
    user: null,
    displayName: null,
    profileLoaded: false,
    
    init() {
      this.checkSession();
      
      // Auth-Änderungen überwachen
      supabaseClient.auth.onAuthStateChange((event, session) => {
        this.session = session;
        
        if (session) {
          this.loadUserProfile();
        } else {
          this.user = null;
          this.displayName = null;
          this.profileLoaded = false;
        }
      });
    },
    
    // Aktuelle Sitzung prüfen
    async checkSession() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        this.session = session;
        
        if (session) {
          this.loadUserProfile();
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Sitzung:', error);
      }
    },
    
    // Benutzerprofil laden
    async loadUserProfile() {
      if (!this.session) return;
      
      try {
        // User-Daten abrufen
        const { data: { user } } = await supabaseClient.auth.getUser();
        this.user = user;
        
        // Display Name aus der profiles-Tabelle abrufen
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        if (!error && profile && profile.display_name) {
          this.displayName = profile.display_name;
          this.profileLoaded = true;
        } else {
          // Kein Display Name gefunden
          this.displayName = user.email || 'Anonymer Nutzer';
          
          // HINWEIS: Die checkDisplayName-Funktionalität wurde zu alpineComponents.js verschoben
          // Keine manuelle Modal-Öffnung mehr hier
        }
      } catch (error) {
        console.error('Fehler beim Laden des Benutzerprofils:', error);
      }
    },
    
    // Diese Funktionen sind jetzt in alpineComponents.js implementiert
    // und sollten dort auch verwendet werden
    async checkDisplayName() {
      console.warn('checkDisplayName() wurde zu alpineComponents.js verschoben');
      return false;
    },
    
    async saveDisplayName(displayName) {
      console.warn('saveDisplayName() wurde zu alpineComponents.js verschoben');
      return false;
    }
  });
});

// Alpine.js Store initialisieren
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Alpine !== 'undefined' && Alpine.store('auth')) {
    Alpine.store('auth').init();
  }
});