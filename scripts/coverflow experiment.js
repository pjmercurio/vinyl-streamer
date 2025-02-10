let container;
let innerContainer;
let leftImageURLs = [];
let currentURLs = [];
let rightImageURLs = [];
let covers = []; // Array of all the cover image elements
let isScrolling = false;
let lastClosestCover;
const bufferSize = 25; // How many images on the DOM at once

// function loadNextImage(currentCover, previousCover) {
//     // Extract the relative path (including desired prefix)
//     const extractFilename = (url) => 'images/albums/' + decodeURIComponent(url.split('/').pop());

//     const previousFilename = previousCover ? extractFilename(previousCover.src) : null;
//     const currentFilename = currentCover ? extractFilename(currentCover.src) : null;

//     const previousImageIndex = currentURLs.indexOf(previousFilename ?? "");
//     const currentImageIndex = currentURLs.indexOf(currentFilename ?? "");

//     console.log("CURRENT IMAGE INDEX: ", currentImageIndex);

//     // Fill buffer until full
//     if (currentURLs.length < bufferSize) {
//         const nextImageURL = rightImageURLs.shift();
//         if (!nextImageURL) return;

//         const nextImageElement = covers[currentURLs.length];
//         nextImageElement.src = nextImageURL;
//         innerContainer.appendChild(nextImageElement);
//         currentURLs.push(nextImageURL);
//         return;
//     }

//     // Handle scrolling right
//     if (currentImageIndex > previousImageIndex) {
//         if (rightImageURLs.length === 0) return;

//         const nextImageURL = rightImageURLs.shift();
//         const firstCover = covers.shift(); // Recycle the leftmost cover

//         // Adjust scroll position to stabilize
//         const previousScrollLeft = container.scrollLeft;
//         const firstCoverWidth = firstCover.getBoundingClientRect().width;

//         // Update and move the recycled element
//         firstCover.src = nextImageURL;
//         innerContainer.removeChild(firstCover);
//         innerContainer.appendChild(firstCover);
//         container.scrollLeft = previousScrollLeft - firstCoverWidth;

//         // Update buffer
//         covers.push(firstCover);
//         currentURLs.shift();
//         currentURLs.push(nextImageURL);

//         console.log("User scrolled to the RIGHT, loaded: ", nextImageURL);
//     }

//     // Handle scrolling left
//     if (currentImageIndex < previousImageIndex) {
//         if (leftImageURLs.length === 0) return;

//         const nextImageURL = leftImageURLs.pop();
//         const lastCover = covers.pop(); // Recycle the rightmost cover

//         // Adjust scroll position to stabilize
//         const previousScrollLeft = container.scrollLeft;

//         // Update and move the recycled element
//         lastCover.src = nextImageURL;
//         innerContainer.removeChild(lastCover);
//         innerContainer.prepend(lastCover);
//         container.scrollLeft = previousScrollLeft + lastCover.getBoundingClientRect().width;

//         // Update buffer
//         covers.unshift(lastCover);
//         currentURLs.pop();
//         currentURLs.unshift(nextImageURL);

//         console.log("User scrolled to the LEFT, loaded: ", nextImageURL);
//     }
// }


function getVisibleAlbumCovers() {
    const visibleImages = [];
    const allImages = document.querySelectorAll('img.album-cover'); // Targeting the correct elements
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Add padding to the viewport
    const padding = 100; // 50px on each side

    allImages.forEach(img => {
        const rect = img.getBoundingClientRect();

        // Check if the image is within the viewport + padding
        if (rect.left < viewportWidth + padding && rect.right > -padding) {
            visibleImages.push(img);
        }
    });

    return visibleImages;
}

function updateCoversTransform() {
    if (!isScrolling) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestCover = null;
    let closestCoverIndex = null;
    let closestDistance = Infinity;

    const visibleCovers = getVisibleAlbumCovers();

    // Get the closest cover to the center
    for (const cover of visibleCovers) {
        const coverRect = cover.getBoundingClientRect();
        const coverCenter = coverRect.left + coverRect.width / 2;

        // Calculate the distance from the center
        const distanceFromCenter = Math.abs(containerCenter - coverCenter);

        // If closest distance starts increasing, break out of the loop
        if (distanceFromCenter > closestDistance) break;

        // Find the image closest to the center
        closestCover = cover;
        closestCoverIndex = covers.indexOf(cover);
        closestDistance = distanceFromCenter;
    }

    
    // If the closest cover hasn't changed, don't update the transformation
    if (closestCover === lastClosestCover) return;

    // Apply transformations
    visibleCovers.forEach(cover => {
        const coverRect = cover.getBoundingClientRect();
        const coverCenter = coverRect.left + coverRect.width / 2;
        const distanceFromCenter = containerCenter - coverCenter;
        const maxDistance = containerRect.width / 2;

        if (cover === closestCover) {
            let transitionDuration = 250;
            cover.style.transition = `transform ${transitionDuration}ms ease-out`;
            cover.style.transform = `perspective(300px) rotateY(0deg) scale(1)`;
            cover.style.zIndex = 100;  // Ensure it's on top
        } else {
            // Normalize the distance to be between -1 and 1
            const normalizedDistance = distanceFromCenter / maxDistance;

            // Apply z-index based on distance
            const zIndex = Math.floor((1 - Math.abs(normalizedDistance)) * 100);
            cover.style.zIndex = zIndex;

            // Apply a rotation proportional to the distance, outside the threshold zone
            let rotationY = normalizedDistance * 50;

            // Cap the rotation at 85 or -85 degrees
            if (rotationY > 85) rotationY = 85;
            else if (rotationY < -85) rotationY = -85;

            // Apply the transformation to rotate the image
            const transformOrigin = distanceFromCenter > 0 ? 'left' : 'right';
            cover.style.transform = `perspective(300px) rotateY(${rotationY}deg) scale(0.85)`;
            cover.style.transformOrigin = `${transformOrigin} center`;
        }
    });

    lastClosestCover = closestCover;
    isScrolling = false;
    requestAnimationFrame(updateCoversTransform);  // Keep the animation smooth
}

// Scroll to the next or previous image
function scrollToNextImage(direction) {
    const scrollAmount = 110;
    const currentScroll = container.scrollLeft;
    if (direction === 'next') {
        container.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
        });
    } else if (direction === 'prev') {
        container.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth'
        });
    }
}

// Handle arrow key events
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        scrollToNextImage('next');
    } else if (event.key === 'ArrowLeft') {
        scrollToNextImage('prev');
    }
});

async function getImages() {
    await fetch('backend.php')
        .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        else return response.json();
        })
        .then(data => {
            let count = 0;
            data.forEach(imagePath => {
                const imgElement = document.createElement('img');
                const imageName = imagePath.split('/').pop();
                imgElement.className = 'album-cover reflection';
                imgElement.src = imagePath;
                imgElement.alt = imageName;
                imgElement.loading = 'lazy';
                // imgElement.onload = () => { console.log("IMAGE LOADED: ", imgElement.src); };
                covers.push(imgElement);
                innerContainer.appendChild(imgElement);
                // if (count < 13) {
                //     innerContainer.appendChild(imgElement);
                //     currentURLs.push(imagePath);
                // } else {
                //     rightImageURLs.push(imagePath);
                // }
                // count++;
            });
        })
        .catch(error => console.error('Error fetching images:', error));
}

document.addEventListener('DOMContentLoaded', async () => {
    innerContainer = document.getElementById('inner-container');
    container = document.querySelector('.container');
    container.addEventListener('scroll', () => {
        isScrolling = true;
        requestAnimationFrame(updateCoversTransform);
    });

    await getImages();
    isScrolling = true;
    requestAnimationFrame(updateCoversTransform);
    setTimeout(() => {
        isScrolling = false;
    }, 500);
});
