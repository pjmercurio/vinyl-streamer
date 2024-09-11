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
});