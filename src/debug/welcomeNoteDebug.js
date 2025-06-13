// Welcome Note Troubleshooting Script
console.log('🔧 Welcome Note Troubleshooting');
console.log('===============================');

// Function to show welcome note immediately
function showWelcomeNote() {
  console.log('🌟 Forcing Welcome Note to Show...');
  
  // Clear session storage to trigger welcome flow
  sessionStorage.removeItem('smartnotes-welcome-shown');
  
  // Force reload to trigger fresh state
  setTimeout(() => {
    console.log('🔄 Reloading page...');
    location.reload();
  }, 1000);
}

// Function to check current state
function checkWelcomeNoteState() {
  console.log('📊 Current State Check');
  console.log('=====================');
  
  // Check localStorage
  const notesData = localStorage.getItem('notes-app-data');
  if (notesData) {
    try {
      const notes = JSON.parse(notesData);
      const hasWelcomeNote = notes.some(note => note.id === 'welcome-note');
      console.log(`📝 Notes in localStorage: ${notes.length}`);
      console.log(`🌟 Welcome note exists: ${hasWelcomeNote}`);
      if (hasWelcomeNote) {
        const welcomeNote = notes.find(note => note.id === 'welcome-note');
        console.log(`📋 Welcome note title: "${welcomeNote.title}"`);
      }
    } catch (e) {
      console.error('❌ Error parsing notes data:', e);
    }
  } else {
    console.log('📝 No notes data in localStorage');
  }
  
  // Check sessionStorage
  const hasSeenWelcome = sessionStorage.getItem('smartnotes-welcome-shown');
  console.log(`👁️ Has seen welcome: ${hasSeenWelcome}`);
  
  return {
    hasNotesData: !!notesData,
    hasSeenWelcome: !!hasSeenWelcome
  };
}

// Function to reset everything and show welcome note
function resetAndShowWelcome() {
  console.log('🔄 Resetting Everything...');
  localStorage.clear();
  sessionStorage.clear();
  setTimeout(() => {
    console.log('🌟 Reloading to show welcome note...');
    location.reload();
  }, 500);
}

// Run initial check
console.log('🔍 Running initial check...');
const state = checkWelcomeNoteState();

console.log('\n🚀 Available Commands:');
console.log('====================');
console.log('showWelcomeNote()     - Force show welcome note');
console.log('resetAndShowWelcome() - Reset everything and show welcome');
console.log('checkWelcomeNoteState() - Check current state');

console.log('\n💡 Quick Fix:');
console.log('=============');
console.log('Run: resetAndShowWelcome()');

// Auto-run the reset if user hasn't seen welcome
if (!state.hasSeenWelcome) {
  console.log('\n🎯 Auto-running welcome note fix in 3 seconds...');
  console.log('(You can cancel by running: clearTimeout(autoFix))');
  
  window.autoFix = setTimeout(() => {
    console.log('🚀 Auto-fixing welcome note display...');
    resetAndShowWelcome();
  }, 3000);
}
