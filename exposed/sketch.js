let images = []; // Array to store loaded images
let originalWidth = 0; // Original width of the images
let originalHeight = 0; // Original height of the images
let cols = 24;
let rows = 5;
let imageWidth, imageHeight;
let gap;
let timer = 0; // Timer to control image change
let changeInterval = 500;
let s = 1;


// Define the functions for getting height and width
function getHeight() {
  return window.innerHeight; // will recalculate each time called
}

function getWidth() {
  return window.innerWidth; // will recalculate each time called
}

// Call the functions to get window height and width
let w_height = getHeight();
let w_width = getWidth();
//end


let jsonData; // Assuming jsonData is defined and contains your JSON data
let currentViewMode; // Initial view mode

let columnVelocities = []; // Array to store random velocities for each column

let imageIDElement;

let osc;
let oldestNote;
let mod;

const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ3FydHBjcmN3anNwenR1a3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwNDI5MDksImV4cCI6MjAyNDYxODkwOX0.EZaxSpSQnJvIA6viW3dhiJVXTyRLJOzH6DQ_zbpMatU"; // Replace with your Supabase key
const url = "https://aagqrtpcrcwjspztuktn.supabase.co"; // Replace with your Supabase URL
const database = supabase.createClient(url, key);

// Probability of image update (adjust as needed)
let updateProbability;

//dom elements
const distance = document.getElementById("distance");
const rotation = document.getElementById("rotation");
const tableName = "touch";
var flip;

function preload() {
  jsonData = loadJSON("assets/image_info.json");
  // Load all images from the "dataset" folder
  for (let i = 1; i <= 1000; i++) {
    // let formattedIndex = String(i).padStart(5, "0");
    let imageName = "assets/_" + i + ".jpg"; //formattedIndex
    images.push(loadImage(imageName));

    // Shuffle function to randomly shuffle an array
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
  }

  // Set the original width and height based on the first image
  originalWidth = images[0].width;
  originalHeight = images[0].height;
}

function setup() {
  createCanvas(getWidth(), getHeight());
  background(0);
  // Get the image ID element from the HTML
  imageIDElement = document.getElementById("imageid");
  osc = new p5.Oscillator(274, "square");
  bass = new p5.Oscillator(274, "sawtooth");

  // Initialize random velocities for each column
  for (let i = 0; i < cols; i++) {
    columnVelocities[i] = random(1, 3); // Adjust the range as needed
  }
}

let cascadeSpeed = 20; // Adjust the speed of the cascading effect
let transitionInProgress = false; // Flag to indicate if a transition is in progress

function draw() {
  let x, y;
  background(0);

  // Adjust gap based on the number of columns
  gap = 8;
  imageWidth = (windowWidth - gap * (cols - 1)) / cols;
  imageHeight = (windowHeight - gap * (cols - 1)) / rows;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let index = j * cols + i;
      let x = i * (imageWidth + gap);
      let y = j * (imageHeight + gap);

      // Adjust y position based on column's speed with random velocity
      if (cols > 2) {
        y += ((frameCount / 1) % (images.length * (imageHeight + gap))) * columnVelocities[i];

        // Ensure y stays within bounds
        y = y % getHeight();
      } else {
        y = y + imageHeight;
      }

      // Display images or text boxes based on the current view mode
      if (currentViewMode === "images") {
        let currentImage = images[(index % images.length) + j];
        image(currentImage, x, y - imageHeight, imageWidth, imageHeight);
      } else if (currentViewMode === "text") {
        let currentData = jsonData[index % 100];
        let textContent = `${currentData.file_name}\n${currentData.resolution[0]} x ${currentData.resolution[1]}`;
        fill(255);
        textFont('SuisseIntl-SemiBold');
        textAlign(LEFT, TOP);
        textSize(map(cols, 1, 22, 32, 8));
        textLeading(textSize);
        text(textContent, x, y, imageWidth, imageHeight);
      }


      //Randomly update the view mode
      if (flip === true) {
        currentViewMode = "images"; //images //text use these for debugging
        //playSynth(0.05);
        console.log(flip);
      } else if (flip === false) {
        currentViewMode = "text";
      }
      // Randomly update the image with a new one
      // let randomNumber = random(0, 10);
      // let changeFactor = map(cols, 1, 20, 9.9998, 9.9999, true);
      // console.log(changeFactor);
      //(randomNumber > changeFactor)
      //random(0,10) > 9.999)
      if (random(0, 10) > 9.999) {
        for (let i = images.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [images[i], images[j]] = [images[j], images[i]];
        }
        playSynth(random(0.05, 0.5));
      }
    }
  }
}

function playSynth(durationInSeconds) {
  userStartAudio();
  bass.start();
  bass.freq(60);
  bass.amp(0.2);

  // Start the oscillator
  osc.start();
  let r = random(1, 2);
  // Set the frequency
  let f = map(cols, 1, 40, 80, 8000);
  osc.freq(f * r);

  // Play for the specified duration
  osc.amp(0.2); // Adjust the amplitude as needed
  osc.start();

  // Stop the oscillator after the specified duration
  setTimeout(() => {
    osc.amp(0.01); // Set amplitude to 0 to stop the sound smoothly
    osc.stop();
  }, durationInSeconds * 1000); // Convert duration to milliseconds
}

// ------------ REMOTE CONTROLS

document.addEventListener("DOMContentLoaded", async () => {
  //subscribe to changes in the
  database
    .channel(tableName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      (payload) => {
        handleInserts(payload.new);
      }
    )
    .subscribe();

  //select all data from touch
  let { data, error } = await database.from(tableName).select("*");
  handleInserts(data[0]);
});

function handleInserts(data) {
  distance.innerHTML = cols + " columns x " + rows + " rows";
  rotation.innerHTML = cols * rows + " images displayed";
  flip = data.isShaken;
  console.log(flip);
  const rect = document.getElementById("rect");
  let rectw = Math.floor(map(data.values.distance, 0, 950, 1, 100));
  rect.style.width = rectw + "vw";
  rect.style.height = "80px";
  //rect.style.transform = `rotate(${data.values.rotation}deg)`;
  cols = Math.floor(map(data.values.distance, 0, 950, 22, 1));
  //cols = Math.floor(data.values.distance);
  rows = Math.floor(map(data.values.distance, 0, 950, 20, 1));
  mod = map(cols, 1, 40, 9.95, 9.9995);
  gap = 2;
  imageWidth = (getWidth() - gap * (cols - 1)) / cols;
  imageHeight = (getHeight() - gap * (cols - 1)) / rows;
}


// ------- TIME STAMP
function updateTimestamp() {
  var now = new Date();
  var year = now.getFullYear().toString().slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var day = ("0" + now.getDate()).slice(-2);
  var hours = ("0" + now.getHours()).slice(-2);
  var minutes = ("0" + now.getMinutes()).slice(-2);
  var seconds = ("0" + now.getSeconds()).slice(-2);

  var timestamp =
    year +
    ":" +
    month +
    ":" +
    day +
    ":" +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  document.getElementById("timestamp").innerText = timestamp;
}

// Update timestamp every second
setInterval(updateTimestamp, 1000);

// Update timestamp on page load
window.onload = function () {
  updateTimestamp();
};
