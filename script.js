document.addEventListener('DOMContentLoaded', function() {
    const audioElement = document.getElementById('audioElement');
    const rotatingImage = document.getElementById('vinylImage');

    // Reload the audio stream when resuming play after a pause
    audioElement.addEventListener('play', () => {
        if (audioElement.paused === false) {
            const currentSrc = audioElement.src;
            audioElement.src = '';
            audioElement.src = currentSrc;
            audioElement.play();
        }
    });

    // Check if the audio is playing, and rotate the image
    audioElement.addEventListener('playing', function() {
        rotatingImage.classList.remove('no-rotate'); // Start rotation
    });

    // If the audio is paused or fails to play, stop the rotation
    audioElement.addEventListener('pause', function() {
        rotatingImage.classList.add('no-rotate'); // Stop rotation
    });

    audioElement.addEventListener('error', function() {
        rotatingImage.classList.add('no-rotate'); // Stop rotation on error
    });

    // Initial check in case the stream is not active on page load
    if (audioElement.paused) {
        rotatingImage.classList.add('no-rotate'); // Stop rotation if not playing
    }
});