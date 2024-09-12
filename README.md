### Description
A little website for streaming music currently playing on my turntable in my apartment.

### Hardware
- Turntable (I have an Audio-Technica AT-LP60X-BK)
- Cable to run from turntable to capture device (I'm using a 1/8" to RCA)
- Audio capture device (I use a VIDBOX VCDE8, mainly used for DV video capturing)
- Cable to connect capture device to computer (I'm using a mini USB for the VIDBOX)

### Getting Started
For this project I use Icecast to host the actual stream, and BUTT ("broadcast using this tool") to capture the audio signal from the VIDBOX and stream it to Icecast.  I initially tried to do this with ffmpeg -> Icecast but I kept having audio quality problems.

1) Install Icecast: `brew install icecast`
2) Configure Icecast: `sudo nano /opt/homebrew/etc/icecast.xml` or if not on Apple Silicon: `sudo nano /usr/local/etc/icecast.xml`
3) Start Icecast manually: `icecast -c /opt/homebrew/etc/icecast.xml`
4) Install BUTT: [HERE](https://danielnoethen.de/butt/)
5) Open BUTT and select audio capture device and add a new streaming server with address as your public ip and port 8000, and the credentials you set in `icecast.xml`, then start streaming.
6) In `index.html` set the stream source to `http://your_public_ip:8000/stream`

### Example

![ezgif-4-4bb92fbc6b](https://github.com/user-attachments/assets/1e87cb7f-4c50-45b7-9857-796943b0080a)

