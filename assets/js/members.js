// Hilfsfunktionen für die Mitgliederverwaltung

async function ensureUsernameExists() {
    // Prüfe, ob der Benutzer bereits einen Benutzernamen hat
    const { data: { user } } = await supabaseClient.auth.getUser();
    const existing = user?.user_metadata?.username;

    if (existing) return; // Benutzername schon gesetzt

    // Wenn kein Username vorhanden ist, Username-Modal anzeigen
    const usernameModal = new bootstrap.Modal(document.getElementById('username-modal'));
    usernameModal.show();

    // Form-Elemente für Username-Modal holen
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const usernameResult = document.getElementById('username-result');

    if (!usernameForm || !usernameInput || !usernameSubmit || !usernameResult) {
      console.error('Username-Modal-Elemente nicht gefunden.');
      return;
    }

    // Event-Listener für Username-Form
    usernameForm.addEventListener('submit', async function handleUsernameSubmit(e) {
      e.preventDefault();

      // Formularvalidierung
      if (!usernameForm.checkValidity()) {
        e.stopPropagation();
        usernameForm.classList.add('was-validated');
        return;
      }

      const username = usernameInput.value.trim();
      if (!username) return;

      // UI während des Sendens aktualisieren
      usernameSubmit.disabled = true;
      usernameSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Speichere...';

      usernameResult.style.display = 'block';
      usernameResult.className = 'mt-3 text-center alert alert-info';
      usernameResult.textContent = 'Überprüfe Verfügbarkeit...';

      try {
        // Verfügbarkeit prüfen
        const { data, error } = await supabaseClient
          .from('usernames')
          .select('id')
          .eq('username', username)
          .limit(1);

        if (data && data.length > 0) {
          // Username bereits vergeben
          usernameResult.className = 'mt-3 text-center alert alert-danger';
          usernameResult.textContent = 'Dieser Name ist schon vergeben.';
          usernameSubmit.disabled = false;
          usernameSubmit.textContent = 'Benutzername speichern';
          return;
        }

        // Username verfügbar, speichern
        const user_id = user.id;
        const { error: insertError } = await supabaseClient
          .from('usernames')
          .insert([{ username, user_id }]);

        if (insertError) {
          throw insertError;
        }

        // In user_metadata speichern
        await supabaseClient.auth.updateUser({
          data: { username }
        });

        // Erfolgsmeldung anzeigen
        usernameResult.className = 'mt-3 text-center alert alert-success';
        usernameResult.textContent = 'Benutzername erfolgreich gespeichert!';

        // Nach 2 Sekunden das Modal schließen
        setTimeout(() => {
          usernameModal.hide();
        }, 2000);

        // Event-Listener entfernen, um doppelte Ausführung zu vermeiden
        usernameForm.removeEventListener('submit', handleUsernameSubmit);

      } catch (error) {
        console.error('Fehler beim Speichern des Benutzernamens:', error);

        usernameResult.className = 'mt-3 text-center alert alert-danger';
        usernameResult.textContent = 'Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler');
      } finally {
        // UI zurücksetzen
        usernameSubmit.disabled = false;
        usernameSubmit.textContent = 'Benutzername speichern';
      }
    });
}

// Login mit E-Mail
async function handleEmailLogin(email) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    console.error('Anmeldefehler:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

// Login-Formular-Handler
function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;

    const result = await handleEmailLogin(email);

    // Löse ein benutzerdefiniertes Event aus, statt alert zu verwenden
    document.dispatchEvent(new CustomEvent('login-attempt-complete', {
      detail: {
        success: result.success,
        message: result.error ? result.error.message : ''
      }
    }));

    // Für ältere Implementierungen behalten wir die Alerts als Fallback
    if (!document.querySelector('#login-result')) {
      if (result.success) {
        alert('Bitte überprüfe deine E-Mails für den Login-Link.');
      } else {
        alert('Fehler bei der Anmeldung: ' + (result.error ? result.error.message : 'Unbekannter Fehler'));
      }
    }
  });
}

// Login-Button-Funktion zur Nutzung in Templates
function renderMemberStatus() {
  const containerEl = document.getElementById('member-status');
  if (!containerEl) return;

  function updateUI() {
    if (window.supabaseSession) {
      containerEl.innerHTML = `
        <a href="#" class="nav-link px-2 text-white" id="logout-button">Ausloggen</a>
      `;
      document.getElementById('logout-button').addEventListener('click', () => {
        supabaseClient.auth.signOut();
      });
    } else {
      containerEl.innerHTML = `
        <a href="#" class="nav-link px-2 text-white" id="login-button">Anmelden</a>
      `;
      document.getElementById('login-button').addEventListener('click', () => {
        // Login-Modal öffnen statt direkt zu Google Auth
        const loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
        loginModal.show();
      });
    }
  }

  // Initial UI setup
  updateUI();

  // Listen for auth changes
  document.addEventListener('supabase-auth-change', updateUI);
}

// Initialisiere alle Member-Funktionen, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
  setupLoginForm();
  renderMemberStatus();
});