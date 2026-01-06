const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener('DOMContentLoaded', function() {
    const volumeSlider = document.getElementById('volumeSlider');
    const audioElement = document.getElementById('audioElement');
    const rotatingImage = document.getElementById('vinyl-image-container');
    const titleText = document.querySelector('h1');
    let audioCtx;

    // Volume control
    volumeSlider.addEventListener('input', function() {
        audioElement.volume = volumeSlider.value;
    });

    if (isTouchDevice) {
        volumeSlider.addEventListener('change', function() {
            audioElement.volume = volumeSlider.value;;
        });
    }

    function setAudioContext() {
        if (!!audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const track = audioCtx.createMediaElementSource(audioElement);
        const panner = audioCtx.createStereoPanner();
        track.connect(panner).connect(audioCtx.destination);
    }

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
        titleText.classList.remove('text-glow');
    });

    // Fetch the listener count initially and every 20 seconds
    fetchListeners();
    setInterval(fetchListeners, 20000);

    setupTonearm();
    setupSockets();
});

// Utility function to get the X position from a mouse or touch event
function getXPosition(event) {
    return isTouchDevice ? event.touches[0].clientX : event.clientX;
}

function getYPosition(event) {
    return isTouchDevice ? event.touches[0].clientY : event.clientY;
}

// Function to fetch the listener count from the Icecast server
async function fetchListeners() {
    try {
      const response = await fetch('https://pauljmercurio.tplinkdns.com/stream/status-json.xsl'); // port 8000
      const data = await response.json();
      const listenerCountElement = document.getElementById('listener-count');
      const listenerCount = data.icestats.source.listeners;

      listenerCountElement.innerText = `Listener Count: ${listenerCount}`;
      listenerCountElement.style.display = 'block';
    } catch (error) {
      console.error('Error fetching Icecast stats:', error);
      listenerCountElement.style.display = 'none';
    }
}

function setupTonearm() {
    const tonearmImage = document.getElementById('tonearmImage');
    const rotatingImage = document.getElementById('vinyl-image-container');
    const titleText = document.querySelector('h1');
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
        const leftRotationLimit = 34;
        const rightRotationLimit = -12;
        if (window.innerWidth < 600) {
            currentRotation += deltaX / 4;
            if (currentRotation <= leftRotationLimit && currentRotation >= rightRotationLimit) {
                tonearmImage.style.transform = `translate(180%, -75%) rotate(${currentRotation}deg)`;
            }
        } else {
            currentRotation += deltaX / 7;
            if (currentRotation <= leftRotationLimit && currentRotation >= rightRotationLimit) {
                tonearmImage.style.transform = `translate(155%, -70%) rotate(${currentRotation}deg)`;
            }
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
            rotatingImage.classList.remove('paused');
            titleText.classList.add('text-glow');
            if (didLetGo) audioElement.muted = false;
        } else {
            rotatingImage.classList.add('paused');
            titleText.classList.remove('text-glow');
            if (didLetGo) audioElement.pause();
        }
    }

    // Event listeners for mouse and touch events
    function startDragging(event) {
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
}

function setupSockets() {
    // Running on port 4000 internally
    const socket = io('https://pauljmercurio.tplinkdns.com', {
        path: '/sockets/', // MUST MATCH server and Nginx
        transports: ["websocket"],  // Force WebSocket (optional but helps)
    });

    const chatWindow = document.getElementById('chatWindow');
    const notificationBubble = document.getElementById('chat-bubble-notification');
    const closeChat = document.getElementById('closeChat');
    const usernameInput = document.getElementById('usernameInput');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesList = document.getElementById('messages');
    let lastMessageTime = null;

    // Function to format the time in AM/PM format
    function formatTimestamp(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // The hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
    }

    // Function to add a timestamp to the chat if it's a new minute
    function addTimestampIfNecessary(timestamp) {
        const currentTime = timestamp ?? new Date();
        if (!lastMessageTime || currentTime.getMinutes() !== lastMessageTime.getMinutes()) {
            const timestampElement = document.createElement('div');
            timestampElement.classList.add('message-timestamp');
            timestampElement.textContent = formatTimestamp(currentTime);
            messagesList.appendChild(timestampElement);
        }
        lastMessageTime = currentTime;
    }

    // Show chat window when listener count is clicked
    document.getElementById('listener-count-container').addEventListener('click', function() {
        chatWindow.style.display = 'flex';
        notificationBubble.style.display = 'none';
        scrollToBottom();
    });

    // Close chat window
    closeChat.addEventListener('click', function() {
        chatWindow.style.display = 'none';
    });

    // Function to send a message
    function sendMessage() {
        const message = messageInput.value;
        const username = usernameInput.value || 'Anonymous';
        const timestamp = new Date();

        try {
            socket.emit('chat message', { message, username, timestamp });  // Send message via WebSocket
            console.log("✅ Message sent successfully!");
    
            messageInput.value = '';  // Clear input field
            messagesList.style.display = 'block';
    
            // Update the default username in local storage
            if (!!usernameInput.value) {
                localStorage.setItem('username', username);
            }
        } catch (error) {
            console.error("🚨 Error sending message:", error);
        }
    }

    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);

    // Send message when Enter key is pressed
    messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && messageInput.value.trim() !== '') {
            sendMessage();
        }
    });

    // Listen for messages from the server
    socket.on('chat message', function(data) {
        createNewMessageElement(data);
        showBadge();

        // If message contains "CURRENT ALBUM", update the album image
        if (data.message.toUpperCase().includes("CURRENT ALBUM")) {
            getLatestAlbum();
        }
    });

    // Block drag event on inputs
    usernameInput.addEventListener('dragstart', (e) => e.preventDefault());
    messageInput.addEventListener('dragstart', (e) => e.preventDefault());
    sendButton.addEventListener('mousedown', (e) => e.stopPropagation());
    closeChat.addEventListener('mousedown', (e) => e.stopPropagation());
    messagesList.addEventListener('mousedown', (e) => e.preventDefault());

    function scrollToBottom() {
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Function to check if the target element is an input that should block dragging
    function isInputField(element) {
        return element === usernameInput || element === messageInput;
    }

    // Make the chat window draggable by dragging the header
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function setupDragging() {
        chatWindow.addEventListener('mousedown', function(e) {
            if (isInputField(e.target)) return;  // Don't drag if clicking on an input field
            isDragging = true;
            offsetX = e.clientX - chatWindow.getBoundingClientRect().left;
            offsetY = e.clientY - chatWindow.getBoundingClientRect().top;
            chatWindow.style.cursor = 'grabbing';  // Change the cursor to grabbing
        });
    
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const newX = e.clientX - offsetX;
                const newY = e.clientY - offsetY;
    
                // Update the chatWindow position
                chatWindow.style.left = `${newX}px`;
                chatWindow.style.top = `${newY}px`;
                chatWindow.style.right = 'auto';  // Clear the right property so left and top take effect
                chatWindow.style.bottom = 'auto'; // Clear the bottom property
            }
        });
    
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                chatWindow.style.cursor = 'auto';
            }
        });
    }

    function createNewMessageElement(data) {
        const messagesList = document.getElementById('messages');
    
        const newMessageItem = document.createElement('li');
        newMessageItem.classList.add('message-item');
    
        const usernameElement = document.createElement('div');
        usernameElement.classList.add('message-username');
        usernameElement.textContent = data.username;
    
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-text');
        messageElement.textContent = data.message;

        const timestamp = new Date(data.timestamp);
        addTimestampIfNecessary(timestamp);
    
        newMessageItem.appendChild(usernameElement);
        newMessageItem.appendChild(messageElement);
    
        messagesList.appendChild(newMessageItem);
        messagesList.style.display = 'block';

        scrollToBottom();
    }

    function showBadge() {
        const isWindowClosed = chatWindow.style.display === 'none' || chatWindow.style.display === '';
        if (isWindowClosed) notificationBubble.style.display = 'block';
    }

    function getPreviousUsername() {
        const username = localStorage.getItem('username');
        usernameInput.value = username || '';
    }
    
    function getPreviousMessages() {
        fetch('https://pauljmercurio.tplinkdns.com/messages/recent?hours=2')
            .then(response => response.json())
            .then(data => {
                data.forEach(createNewMessageElement);
            });
    }

    async function getLatestAlbum() {
        const albumImages = await getAlbumImages();
        fetch('https://pauljmercurio.tplinkdns.com/messages/current-album')
            .then(response => response.json())
            .then(data => {
                const albumMessage = data[0].message;
                const regex = /CURRENT ALBUM:\s*(.*)/i;
                const match = albumMessage.match(regex);
                const album = match[1].trim();
                const closestMatch = findMatchingAlbum(albumImages, album);
                document.getElementById('album-image').src = closestMatch;
            });
    }

    async function getAlbumImages() {
        return await fetch('backend.php')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                else return response.json();
            })
            .catch(error => console.error('Error fetching images:', error));
    }

    setupDragging();
    getPreviousUsername();
    getPreviousMessages();
    getLatestAlbum();
}

function findMatchingAlbum(albumImages, album) {
    for (const image of albumImages) {
        if (image.toLowerCase().includes(album.toLowerCase())) {
            return image;
        }
    }
    return "images/album_default.jpg";
}