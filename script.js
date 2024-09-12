const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener('DOMContentLoaded', function() {
    const audioElement = document.getElementById('audioElement');
    const rotatingImage = document.getElementById('vinylImage');
    const tonearmImage = document.getElementById('tonearmImage');

    audioElement.addEventListener('playing', function() {
        console.log(`PLAYER PLAYING! Muted: ${audioElement.muted}`);
        fetchListeners();
    });

    // Reload the audio source so pressing play again is caught up
    audioElement.addEventListener('pause', function() {
        console.log(`PLAYER PAUSED! Muted: ${audioElement.muted}`);
        const currentSrc = audioElement.children[0].src;
        audioElement.src = '';
        audioElement.src = currentSrc;
        fetchListeners();
    });

    audioElement.addEventListener('error', function() {
        rotatingImage.classList.add('paused');
    });

    // Fetch the listener count initially and every 20 seconds
    fetchListeners();
    setInterval(fetchListeners, 20000);

    let isDragging = false;
    let startX;
    let currentRotation = 0;

    // Function to calculate angle based on mouse movement
    function rotateTonearm(e) {
        if (!isDragging) return;

        // Get the difference in the mouse's horizontal movement
        const currentX = getXPosition(e);
        const deltaX = -(currentX - startX)

        // Rotate the tonearm based on the new angle
        if (window.innerWidth < 600) {
            currentRotation += deltaX / 4;
            tonearmImage.style.transform = `translate(180%, -75%) rotate(${currentRotation}deg)`;
        } else {
            currentRotation += deltaX / 7;
            tonearmImage.style.transform = `translate(155%, -70%) rotate(${currentRotation}deg)`;
        }
        
        // Update the starting X position for the next move
        startX = currentX;

        checkOverlap();
    }

    // Function to check overlap between tonearm and vinyl
    function checkOverlap(didLetGo = false) {
        const transform = tonearmImage.style.transform;
        let transformRotation = 0;

        if (transform.includes('rotate')) {
            const match = transform.match(/rotate\(([-\d.]+)deg\)/);
            if (match) transformRotation = parseFloat(match[1]);
        }

        // Determine if the tonearm is over the vinyl and play/pause the audio
        if (transformRotation > 5.5) {
            vinylImage.classList.remove('paused');
            if (didLetGo) audioElement.muted = false;
        } else {
            vinylImage.classList.add('paused');
            if (didLetGo) audioElement.pause();
        }
    }

    // Event listeners for mouse and touch events
    function startDragging(event) {
        console.log("START DRAGGING");
        isDragging = true;
        startX = getXPosition(event);

        // Prevent default touch actions like scrolling
        if (event.type === 'touchstart') {
            event.preventDefault();
        }

        document.addEventListener(isTouchDevice ? 'touchmove' : 'mousemove', rotateTonearm);
        document.addEventListener(isTouchDevice ? 'touchend' : 'mouseup', stopDragging);

        // Start playing (muted) when the tonearm is lifted on start event to get around mobile restrictions
        audioElement.muted = true;
        audioElement.play();
    }

    function stopDragging(event) {
        console.log("STOP DRAGGING!");;
        if (isDragging) checkOverlap(true);
        isDragging = false;
        document.removeEventListener(isTouchDevice ? 'touchmove' : 'mousemove', rotateTonearm);
        document.removeEventListener(isTouchDevice ? 'touchend' : 'mouseup', stopDragging);
    }

    // Prevent dragging of the tonearm image in default browser behavior
    tonearmImage.addEventListener('dragstart', (e) => e.preventDefault());

    // Mouse/Touch drag start events
    tonearmImage.addEventListener('mousedown', startDragging);
    tonearmImage.addEventListener('touchstart', startDragging);
});

// Utility function to get the X position from a mouse or touch event
function getXPosition(event) {
    return isTouchDevice ? event.touches[0].clientX : event.clientX;
}

// Function to fetch the listener count from the Icecast server
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
    }
}
