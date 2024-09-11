document.addEventListener('DOMContentLoaded', function() {
    const audioElement = document.getElementById('audioElement');
    const rotatingImage = document.getElementById('vinylImage');

    // Check if the audio is playing, and rotate the image
    audioElement.addEventListener('playing', function() {
        rotatingImage.classList.remove('paused'); // Start rotation
    });

    // If the audio is paused or fails to play, stop the rotation
    // Also reload the audio source so pressing play again is caught up
    audioElement.addEventListener('pause', function() {
        rotatingImage.classList.add('paused');
        const currentSrc = audioElement.children[0].src;
        audioElement.src = '';
        audioElement.src = currentSrc;
    });

    audioElement.addEventListener('error', function() {
        rotatingImage.classList.add('paused');
    });

    // Initial check in case the stream is not active on page load
    if (audioElement.paused) {
        rotatingImage.classList.add('paused');
    }

    // If Safari is detected, modify the audio element style
    checkIfSafari();

    // Fetch the listener count initially and every 20 seconds
    fetchListeners();
    setInterval(fetchListeners, 20000);
});

async function fetchListeners() {
    try {
      const response = await fetch('http://paulmercurio.tplinkdns.com:8001/status-json.xsl');
      const data = await response.json();
      const listenerCountElement = document.getElementById('listener-count');
      const listenerCount = data.icestats.source.listeners;

      listenerCountElement.style.display = 'block';
      listenerCountElement.innerText = `Listener Count: ${listenerCount}`;
    } catch (error) {
      console.error('Error fetching Icecast stats:', error);
      listenerCountElement.style.display = 'none';
      listenerCountElement.innerText = 'Error fetching listener count';
    }
}

function checkIfSafari() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isSafari) return;
    const audioElement = document.getElementById('audioElement');
    if (audioElement) {
        audioElement.style.width = 'revert'; // Remove the fixed width for Safari
    }
}
