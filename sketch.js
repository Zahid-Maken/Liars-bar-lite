// Global variables
let players = [
    { id: 0, type: 'human', pos: [0.5, 0.9], color: 'red', label: 'You', hand: [], active: true, pulls: 0, profileIndex: 0 },
    { id: 1, type: 'bot', pos: [0.9, 0.5], color: 'blue', label: 'Fox', hand: [], active: true, pulls: 0, profileIndex: 1 },
    { id: 2, type: 'bot', pos: [0.5, 0.1], color: 'green', label: 'Cow', hand: [], active: true, pulls: 0, profileIndex: 2 },
    { id: 3, type: 'bot', pos: [0.1, 0.5], color: 'yellow', label: 'Dog', hand: [], active: true, pulls: 0, profileIndex: 3 }
  ];
  let cardOfTable;
  let currentPlayer;
  let playedCards = [];
  let lastPlayedBy = null;
  let selectedCards = [];
  let gamePhase = "playing";
  let message = "";
  let actionTimer = 0;
  let canvasWidth, canvasHeight;
  let showSettings = false;
  let selectedProfileIndex = 0;
  // Define profile images for players
  let profileImages = [
    { name: "Avatar 1", img: null },
    { name: "Avatar 2", img: null },
    { name: "Avatar 3", img: null },
    { name: "Avatar 4", img: null }
  ];
  // Add table image variable
  let tableImage = null;
  // Add card images
  let cardImages = {
    "Ace": null,
    "King": null,
    "Queen": null,
    "Joker": null,
    "Back": null
  };
  let rouletteTargetPlayer = null;
  let usedProfileIndices = [0, 1, 2, 3]; // Initialize with all profile indices assigned
  
  // Loading state variables
  let isLoading = true;
  let loadingProgress = 0;
  let displayedProgress = 0; // For smooth animation
  let totalAssets = 12; // Updated: 4 profiles + 1 table + 5 cards + 2 card backs
  let loadedAssets = 0;
  // Artificially slow down loading a bit to show the progress bar
  let minLoadingTime = 60; // frames (at 60fps = 1 second) - reduced from 90
  let loadingTimer = 0;
  let loadingTimeout = 90; // Force complete loading after 1.5 seconds if stuck - reduced from 120
  let loadingPhases = [
    "Loading assets...",
    "Preparing game...",
    "Setting up players...",
    "Almost ready..."
  ];
  let currentLoadingPhase = 0;
  let loadingFailed = false;
  
  function preload() {
    // Function to update the HTML loading indicator
    function updateHTMLLoadingProgress(progress) {
      const loadingElement = document.getElementById('loadingProgress');
      if (loadingElement) {
        loadingElement.style.width = progress + '%';
      }
      
      const loadingText = document.getElementById('loadingText');
      if (loadingText) {
        const phase = loadingPhases[currentLoadingPhase];
        loadingText.innerHTML = phase + '<span id="loading-dots">...</span>';
      }
      
      const loadingPercentage = document.getElementById('loading-percentage');
      if (loadingPercentage) {
        loadingPercentage.innerText = Math.floor(progress) + '%';
      }
    }
    
    // Create fallback images first
    for (let i = 0; i < profileImages.length; i++) {
      // Create a fallback colored circle as the profile image
      const colors = ['red', 'blue', 'green', 'purple'];
      profileImages[i].img = createFallbackImage(colors[i]);
    }
    
    // Create fallback table image
    createFallbackTableImage();
    
    // Create fallback card images
    createFallbackCardImages();
    
    // Use the preloaded HTML images instead of p5.js loadImage
    for (let i = 0; i < profileImages.length; i++) {
      try {
        // Get the preloaded image from HTML
        const htmlImg = document.getElementById(`pfp${i+1}`);
        
        // Create a p5.js image from the HTML image
        if (htmlImg) {
          let img = createImage(htmlImg.width, htmlImg.height);
          img.drawingContext.drawImage(htmlImg, 0, 0);
          console.log(`Successfully loaded image ${i+1}.png from HTML element`);
          profileImages[i].img = img;
        } else {
          console.warn(`HTML image element pfp${i+1} not found`);
          // Using fallback image already set
        }
        
        // Update loading progress regardless
        loadedAssets++;
        loadingProgress = (loadedAssets / totalAssets) * 100;
        updateHTMLLoadingProgress(loadingProgress);
      } catch (e) {
        console.warn("Exception loading image:", e);
        // Already using fallback image
        loadedAssets++;
        loadingProgress = (loadedAssets / totalAssets) * 100;
        updateHTMLLoadingProgress(loadingProgress);
      }
    }
    
    // Load table image from HTML
    try {
      const htmlTableImg = document.getElementById('tableImg');
      
      if (htmlTableImg) {
        // Create a p5.js image from the HTML image
        tableImage = createImage(htmlTableImg.width, htmlTableImg.height);
        tableImage.drawingContext.drawImage(htmlTableImg, 0, 0);
        console.log('Successfully loaded table image from HTML element');
      } else {
        console.warn('HTML table image element not found');
        // Using fallback table image already set
      }
      
      // Update loading progress
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    } catch (e) {
      console.warn("Exception loading table image:", e);
      // Already using fallback image
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    }
    
    // Load card images from HTML
    const cardMappings = {
      "card1": "Ace",
      "card2": "King",
      "card3": "Queen",
      "card4": "Joker"
    };
    
    for (const [htmlId, cardType] of Object.entries(cardMappings)) {
      try {
        const htmlCardImg = document.getElementById(htmlId);
        
        if (htmlCardImg) {
          // Create a p5.js image from the HTML image
          cardImages[cardType] = createImage(htmlCardImg.width, htmlCardImg.height);
          cardImages[cardType].drawingContext.drawImage(htmlCardImg, 0, 0);
          console.log(`Successfully loaded ${cardType} card image from HTML element`);
        } else {
          console.warn(`HTML card image element ${htmlId} not found`);
          // Using fallback card image already set
        }
        
        // Update loading progress
        loadedAssets++;
        loadingProgress = (loadedAssets / totalAssets) * 100;
        updateHTMLLoadingProgress(loadingProgress);
      } catch (e) {
        console.warn(`Exception loading ${cardType} card image:`, e);
        // Already using fallback image
        loadedAssets++;
        loadingProgress = (loadedAssets / totalAssets) * 100;
        updateHTMLLoadingProgress(loadingProgress);
      }
    }
    
    // Load card back image
    try {
      const cardBackImg = document.getElementById('cardBack');
      
      if (cardBackImg) {
        // Create a p5.js image from the HTML image
        cardImages["Back"] = createImage(cardBackImg.width, cardBackImg.height);
        cardImages["Back"].drawingContext.drawImage(cardBackImg, 0, 0);
        console.log('Successfully loaded card back image from HTML element');
      } else {
        console.warn('HTML card back image element not found');
        // Will use fallback card back image
      }
      
      // Update loading progress
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    } catch (e) {
      console.warn("Exception loading card back image:", e);
      // Will use fallback card back image
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    }
    
    // Load new card back image
    try {
      const newCardBackImg = document.getElementById('newCardBack');
      
      if (newCardBackImg) {
        // Create a p5.js image from the HTML image and use it as the new back
        cardImages["Back"] = createImage(newCardBackImg.width, newCardBackImg.height);
        cardImages["Back"].drawingContext.drawImage(newCardBackImg, 0, 0);
        console.log('Successfully loaded new card back image from HTML element');
      } else {
        console.warn('HTML new card back image element not found');
      }
      
      // Update loading progress
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    } catch (e) {
      console.warn("Exception loading new card back image:", e);
      loadedAssets++;
      loadingProgress = (loadedAssets / totalAssets) * 100;
      updateHTMLLoadingProgress(loadingProgress);
    }
    
    // Only create fallback if we couldn't load the real image
    if (!cardImages["Back"]) {
      createCardBackImage();
    }
  }
  
  // Create a fallback image with a color
  function createFallbackImage(color) {
    let img = createGraphics(100, 100);
    img.background(color);
    img.ellipse(50, 50, 90, 90);
    return img;
  }
  
  // Create a fallback table image
  function createFallbackTableImage() {
    tableImage = createGraphics(600, 400);
    tableImage.background(139, 69, 19); // Brown color
    tableImage.fill(120, 60, 15);
    // Add some wood grain texture with lines
    tableImage.strokeWeight(2);
    for (let i = 0; i < 30; i++) {
      tableImage.stroke(100 + random(50), 50 + random(30), 10 + random(20), 100);
      let y = i * 15;
      let xWave = 5 + random(5);
      for (let x = 0; x < 600; x += 10) {
        tableImage.line(x, y + sin(x * 0.1) * xWave, x + 10, y + sin((x + 10) * 0.1) * xWave);
      }
    }
  }
  
  // Create fallback card images
  function createFallbackCardImages() {
    const cardTypes = ["Ace", "King", "Queen", "Joker"];
    const cardColors = [color(255, 0, 0), color(0, 0, 255), color(0, 128, 0), color(128, 0, 128)];
    
    for (let i = 0; i < cardTypes.length; i++) {
      const cardType = cardTypes[i];
      const cardColor = cardColors[i];
      
      let img = createGraphics(120, 168); // Standard card ratio 7:10
      img.background(255);
      img.strokeWeight(5);
      img.stroke(0);
      img.noFill();
      img.rect(5, 5, 110, 158, 10);
      
      img.fill(cardColor);
      img.noStroke();
      img.textSize(20);
      img.textAlign(CENTER, TOP);
      img.text(cardType, 60, 10);
      
      img.textSize(40);
      img.textAlign(CENTER, CENTER);
      img.text(cardType === "Ace" ? "A" : 
               cardType === "King" ? "K" : 
               cardType === "Queen" ? "Q" : 
               "J", 60, 84);
      
      img.textSize(20);
      img.textAlign(CENTER, BOTTOM);
      img.text(cardType, 60, 158);
      
      cardImages[cardType] = img;
    }
  }
  
  // Create card back image
  function createCardBackImage() {
    let img = createGraphics(120, 168); // Standard card ratio 7:10
    img.background(30, 60, 180);
    img.strokeWeight(5);
    img.stroke(0);
    img.noFill();
    img.rect(5, 5, 110, 158, 10);
    
    // Card back pattern
    img.strokeWeight(1);
    img.stroke(255, 255, 255, 100);
    for (let i = 0; i < 15; i++) {
      img.line(10 + i * 7, 10, 10 + i * 7, 158);
    }
    for (let i = 0; i < 22; i++) {
      img.line(10, 10 + i * 7, 110, 10 + i * 7);
    }
    
    img.fill(255);
    img.noStroke();
    img.textSize(24);
    img.textAlign(CENTER, CENTER);
    img.text("L Bar", 60, 84);
    
    cardImages["Back"] = img;
  }
  
  function setup() {
    // Create responsive canvas that fills the window
    canvasWidth = windowWidth * 0.95;
    canvasHeight = windowHeight * 0.95;
    createCanvas(canvasWidth, canvasHeight);
    textAlign(CENTER, CENTER);
    selectedProfileIndex = players[0].profileIndex;
    
    // Hide the HTML loading indicator when the game starts
    function hideHTMLLoading() {
      const loadingScreen = document.getElementById('p5_loading');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    }
    
    // Set a global timeout to ensure loading completes even if assets fail
    setTimeout(function() {
      if (isLoading) {
        console.log("Loading timeout reached, forcing game start");
        isLoading = false;
        hideHTMLLoading();
        startNewRound();
      }
    }, 5000); // 5-second failsafe timeout
    
    // Don't start the game yet if still loading
    if (loadedAssets >= totalAssets) {
      isLoading = false;
      hideHTMLLoading();
      startNewRound();
    }
  }
  
  function windowResized() {
    // Resize canvas when window is resized
    canvasWidth = windowWidth * 0.95;
    canvasHeight = windowHeight * 0.95;
    resizeCanvas(canvasWidth, canvasHeight);
  }
  
  function draw() {
    background(255);
  
    // Simulate additional resource loading
    if (isLoading && frameCount % 10 === 0 && loadedAssets < totalAssets) {
      // If we're stuck at the same loading progress for too long, increment loadedAssets
      if (frameCount > 180 && loadingProgress < 100) { // After 3 seconds
        loadedAssets++;
        loadingProgress = (loadedAssets / totalAssets) * 100;
        console.log(`Forced loading progress: ${Math.floor(loadingProgress)}%, Assets: ${loadedAssets}/${totalAssets}`);
      }
      
      // Update loading phase text based on progress
      currentLoadingPhase = floor(map(loadingProgress, 0, 100, 0, loadingPhases.length - 1));
      currentLoadingPhase = constrain(currentLoadingPhase, 0, loadingPhases.length - 1);
    }
  
    // Check if assets have finished loading - force complete after timeout
    if ((loadedAssets >= totalAssets || loadingTimer > loadingTimeout) && isLoading) {
      // Force complete loading if stuck
      if (loadedAssets < totalAssets) {
        loadedAssets = totalAssets;
        loadingProgress = 100;
      }
      
      loadingTimer++;
      currentLoadingPhase = loadingPhases.length - 1; // Show "Almost ready..."
      
      // Wait minimum loading time before starting game
      if (loadingTimer >= minLoadingTime) {
        isLoading = false;
        startNewRound();
        console.log("Loading complete, starting game!");
      }
    }
  
    // Show loading screen if we're still loading
    if (isLoading) {
      drawLoadingScreen();
      return;
    }
  
    // Calculate sizes relative to canvas dimensions
    let playerSize = min(canvasWidth, canvasHeight) * 0.1; // Increased player size
    
    // Adjust table size based on screen size to make it smaller on larger devices
    let tableScaleFactor = min(0.5, 0.5 * (1 - (canvasWidth - 800) / 5000));  // Reduce scale factor as screen width increases
    let tableWidth = canvasWidth * tableScaleFactor; 
    let tableHeight = tableWidth; // Make table round (square with image being round)
    let tableX = (canvasWidth - tableWidth) / 2;
    let tableY = (canvasHeight - tableHeight) / 2;
    
    // Increase card size with responsive scaling
    let cardWidth = min(canvasWidth * 0.08, 70);
    let cardHeight = cardWidth * 1.4;
    let spacing = min(canvasWidth, canvasHeight) * 0.02; // Consistent spacing 
    let fontSize = min(canvasWidth, canvasHeight) * 0.025;
    textSize(fontSize);
  
    // Draw table
    if (tableImage) {
      // Calculate aspect ratio to prevent stretching
      let imgAspectRatio = tableImage.width / tableImage.height;
      let containerAspectRatio = tableWidth / tableHeight;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider than container (relative to height)
        drawWidth = tableWidth;
        drawHeight = drawWidth / imgAspectRatio;
        offsetY = (tableHeight - drawHeight) / 2;
      } else {
        // Image is taller than container (relative to width)
        drawHeight = tableHeight;
        drawWidth = drawHeight * imgAspectRatio;
        offsetX = (tableWidth - drawWidth) / 2;
      }
      
      image(tableImage, tableX + offsetX, tableY + offsetY, drawWidth, drawHeight);
    } else {
      fill(139, 69, 19); // Brown color for table
      ellipse(tableX + tableWidth/2, tableY + tableHeight/2, tableWidth, tableHeight);
    }
    
    // Draw card of the table info in top left corner with actual card image
    fill(255);
    strokeWeight(2);
    stroke(0);
    let tableCardX = canvasWidth * 0.08;
    let tableCardY = canvasHeight * 0.08;
    let tableCardWidth = cardWidth * 0.9;
    let tableCardHeight = tableCardWidth * 1.4;
    
    textAlign(LEFT, CENTER);
    textSize(fontSize * 1.1);
    text("Card of the Table:", tableCardX - tableCardWidth * 0.5, tableCardY - tableCardHeight * 0.7);
    textAlign(CENTER, CENTER);
    
    // Draw the actual card image next to the text
    drawCard(cardOfTable, tableCardX, tableCardY, tableCardWidth, tableCardHeight);
    noStroke();
    
    // Draw center cards stacked as in the reference image
    if (playedCards.length > 0) {
      let centerX = canvasWidth * 0.5;
      let centerY = canvasHeight * 0.5;
      let cardOffsetX = cardWidth * 0.03;
      let cardOffsetY = cardHeight * 0.03;
      
      // Draw cards stacked with a small offset
      for (let i = 0; i < playedCards.length; i++) {
        let card = playedCards[i];
        let x = centerX - cardWidth/2 + i * cardOffsetX;
        let y = centerY - cardHeight/2 + i * cardOffsetY;
        
        if (gamePhase === "revealing") {
          // Draw the actual card
          drawCard(card, x, y, cardWidth, cardHeight);
          
          // Draw colored overlay for correct/incorrect cards
          if (card === cardOfTable || card === "Joker") {
            fill(0, 255, 0, 100); // Green for correct cards (semi-transparent)
          } else {
            fill(255, 0, 0, 100); // Red for incorrect cards (semi-transparent)
          }
          rect(x, y, cardWidth, cardHeight, cardWidth * 0.1);
        } else {
          // Draw face-down cards using the card back image
          if (cardImages["Back"]) {
            // Use the loaded card back image
            image(cardImages["Back"], x, y, cardWidth, cardHeight);
          } else {
            // Fallback if card back image doesn't exist
            fill(100); // Gray for face-down cards
            rect(x, y, cardWidth, cardHeight);
          }
        }
      }
    }
  
    // Draw players and their cards
    for (let player of players) {
      if (player.active) {
        let xPos = player.pos[0] * canvasWidth;
        let yPos = player.pos[1] * canvasHeight;
        
        // Draw player avatar - only draw if image exists
        if (profileImages[player.profileIndex] && profileImages[player.profileIndex].img) {
          imageMode(CENTER);
          image(profileImages[player.profileIndex].img, xPos, yPos, playerSize, playerSize);
          imageMode(CORNER);
        } else {
          // Fallback if image doesn't exist
          fill(player.color);
          ellipse(xPos, yPos, playerSize, playerSize);
        }
        
        // Draw player label and pull count
        fill(0);
        strokeWeight(2);
        stroke(255);
        textSize(fontSize * 1.2);
        text(player.label, xPos, yPos + playerSize * 0.8);
        
        if (player.pulls > 0) {
          let pullPos = getPositionRelativeToTable(player.id, playerSize * 1.6, 0.25);
          textSize(fontSize);
          text(`Pulls: ${player.pulls}`, pullPos.x, pullPos.y);
        }
        noStroke();
        textSize(fontSize);
        
        // Highlight current player with a circle
        if (player.id === currentPlayer && gamePhase === "playing") {
          stroke(255, 255, 0); // Yellow
          strokeWeight(playerSize * 0.1);
          noFill();
          ellipse(xPos, yPos, playerSize * 1.4, playerSize * 1.4);
          noStroke();
        }
        
        // Draw remaining cards for bots in a fan layout
        if (player.type === 'bot' && player.hand.length > 0) {
          let cardRadius = tableWidth * 0.6; // Distance from table center
          let fanAngle = PI/8; // Angle of the card fan
          
          let tableCenterX = tableX + tableWidth/2;
          let tableCenterY = tableY + tableHeight/2;
          
          // Position and angle depend on player position
          let baseAngle;
          if (player.id === 1) baseAngle = 0; // Right
          else if (player.id === 2) baseAngle = PI/2; // Top
          else baseAngle = PI; // Left
          
          // Draw card backs in fan arrangement
          for (let i = 0; i < player.hand.length; i++) {
            let cardAngle = baseAngle - (fanAngle/2) + (fanAngle * i / (player.hand.length - 1 || 1));
            
            // Place cards on the edge of the table
            let cardX = tableCenterX + cos(cardAngle) * cardRadius;
            let cardY = tableCenterY - sin(cardAngle) * cardRadius;
            
            push();
            translate(cardX, cardY);
            // Rotate cards to point outward from table center
            rotate(-cardAngle + PI/2);
            
            if (cardImages["Back"]) {
              image(cardImages["Back"], -cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            } else {
              fill(100); // Gray fallback
              rect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            }
            pop();
          }
        }
      }
    }
  
    // Draw human player's hand in a horizontal layout along the bottom
    if (players[0].active) {
      // Calculate spacing based on number of cards and available width
      let availableWidth = canvasWidth * 0.75; // Use 75% of canvas width
      let cardOverlapRatio = min(0.8, max(0.3, 1 - (players[0].hand.length * cardWidth / availableWidth)));
      
      let handWidth = players[0].hand.length * cardWidth * cardOverlapRatio;
      let startX = (canvasWidth - handWidth) / 2;
      let bottomY = canvasHeight - playerSize * 0.7; // Position relative to player avatar
      
      // Calculate card positions in a horizontal row with consistent spacing
      for (let i = 0; i < players[0].hand.length; i++) {
        let card = players[0].hand[i];
        let x = startX + i * (cardWidth * cardOverlapRatio);
        let y = bottomY - cardHeight - spacing * 2; // Fixed distance from bottom of screen
        
        // Draw card using the card images
        drawCard(card, x, y, cardWidth, cardHeight);
        
        if (selectedCards.includes(i)) {
          stroke(255, 0, 0);
          strokeWeight(3);
          noFill();
          rect(x, y, cardWidth, cardHeight);
          noStroke();
        }
      }
    }
  
    // Draw buttons for human player
    if (gamePhase === "playing" && currentPlayer === 0) {
      let buttonWidth = canvasWidth * 0.15;
      let buttonHeight = canvasHeight * 0.05;
      let buttonY = canvasHeight * 0.95;
      
      if (selectedCards.length > 0) {
        fill(0, 255, 0);
        rect(canvasWidth * 0.35 - buttonWidth/2, buttonY - buttonHeight, buttonWidth, buttonHeight);
        fill(0);
        text("Play Selected", canvasWidth * 0.35, buttonY - buttonHeight/2);
      }
      
      if (lastPlayedBy !== null) {
        fill(255, 0, 0);
        rect(canvasWidth * 0.65 - buttonWidth/2, buttonY - buttonHeight, buttonWidth, buttonHeight);
        fill(0);
        text("Declare Liar", canvasWidth * 0.65, buttonY - buttonHeight/2);
      }
    }
  
    // Draw message
    fill(0);
    strokeWeight(2);
    stroke(255);
    textAlign(CENTER);
    textSize(fontSize * 1.3);
    text(message, canvasWidth * 0.5, canvasHeight * 0.05);
    noStroke();
    textSize(fontSize);
    
    // Draw settings icon in top right corner
    let iconSize = min(canvasWidth, canvasHeight) * 0.04;
    let iconX = canvasWidth - iconSize * 1.5;
    let iconY = iconSize * 1.5;
    
    // Draw gear icon
    fill(100);
    ellipse(iconX, iconY, iconSize, iconSize);
    fill(255);
    ellipse(iconX, iconY, iconSize * 0.7, iconSize * 0.7);
    
    // Draw gear teeth
    stroke(100);
    strokeWeight(iconSize * 0.15);
    for (let i = 0; i < 8; i++) {
      let angle = i * PI / 4;
      let x1 = iconX + cos(angle) * (iconSize * 0.35);
      let y1 = iconY + sin(angle) * (iconSize * 0.35);
      let x2 = iconX + cos(angle) * (iconSize * 0.5);
      let y2 = iconY + sin(angle) * (iconSize * 0.5);
      line(x1, y1, x2, y2);
    }
    noStroke();
    
    // Draw settings panel if open
    if (showSettings) {
      // Semi-transparent overlay
      fill(0, 0, 0, 100);
      rect(0, 0, canvasWidth, canvasHeight);
      
      // Settings panel
      let panelWidth = canvasWidth * 0.3;
      let panelHeight = canvasHeight * 0.5;
      let panelX = canvasWidth - panelWidth - iconSize;
      let panelY = iconSize * 3;
      
      fill(255);
      rect(panelX, panelY, panelWidth, panelHeight, 10);
      
      // Panel header
      fill(50);
      textSize(fontSize * 1.2);
      text("Settings", panelX + panelWidth/2, panelY + fontSize * 2);
      
      // Close button
      let closeSize = fontSize;
      let closeX = panelX + panelWidth - closeSize;
      let closeY = panelY + closeSize;
      
      fill(200);
      ellipse(closeX, closeY, closeSize, closeSize);
      fill(50);
      textSize(fontSize * 0.8);
      text("X", closeX, closeY);
      
      // Profile color section
      textSize(fontSize);
      textAlign(LEFT);
      fill(50);
      text("Choose Avatar:", panelX + fontSize, panelY + fontSize * 4);
      
      // Draw profile image options
      let profileSize = min(panelWidth * 0.15, panelHeight * 0.15);
      let startProfileX = panelX + fontSize;
      let profileY = panelY + fontSize * 5.5;
      
      for (let i = 0; i < profileImages.length; i++) {
        let profileX = startProfileX + i * (profileSize * 1.3);
        
        // Draw selection border
        if (i === selectedProfileIndex) {
          stroke(0, 100, 255);
          strokeWeight(3);
        } else {
          stroke(150);
          strokeWeight(1);
        }
        
        // Draw profile image option
        fill(255);
        ellipse(profileX + profileSize/2, profileY + profileSize/2, profileSize, profileSize);
        
        // Draw the image
        imageMode(CENTER);
        image(profileImages[i].img, profileX + profileSize/2, profileY + profileSize/2, profileSize - 4, profileSize - 4);
        imageMode(CORNER);
        
        noStroke();
        
        // Profile name
        fill(50);
        textSize(fontSize * 0.7);
        textAlign(CENTER);
        text(profileImages[i].name, profileX + profileSize/2, profileY + profileSize + fontSize);
      }
      
      // Add explanation about avatar selection
      fill(50);
      textSize(fontSize * 0.7);
      textAlign(CENTER);
      text("Other players will automatically be assigned different avatars", 
           panelX + panelWidth/2, profileY + profileSize + fontSize * 3);
      
      // Apply button
      let buttonWidth = panelWidth * 0.5;
      let buttonHeight = fontSize * 2;
      let buttonX = panelX + (panelWidth - buttonWidth) / 2;
      let buttonY = panelY + panelHeight - buttonHeight - fontSize * 2;
      
      fill(0, 150, 0);
      rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
      fill(255);
      textAlign(CENTER);
      text("Apply", buttonX + buttonWidth/2, buttonY + buttonHeight/2);
      
      // Add warning message if user can't change avatar during round
      if (gamePhase !== "playing" || playedCards.length === 0) {
        // Can change avatar in between rounds
      } else {
        fill(255, 0, 0);
        textSize(fontSize * 0.75);
        text("Cannot change avatar during a round", 
             panelX + panelWidth/2, buttonY - fontSize);
      }
      
      // Reset text settings
      textSize(fontSize);
      textAlign(CENTER, CENTER);
    }
    
    // Handle bot actions with improved timing for sound playback
    if (gamePhase === "playing" && players[currentPlayer].type === 'bot') {
      // Longer delay (4 seconds) to allow previous sound to complete
      if (frameCount - actionTimer > 240) {
        botAction();
        actionTimer = frameCount;
      }
    }
  
    // Handle phase transitions with longer delays
    if (gamePhase === "revealing" && frameCount - actionTimer > 240) {
      resolveDeclaration();
      actionTimer = frameCount;
    }
    if (gamePhase === "roulette" && frameCount - actionTimer > 240) {
      startNewRound();
    }
  }
  
  // Function to draw loading screen
  function drawLoadingScreen() {
    background(240);
    
    // Smooth progress animation
    displayedProgress = lerp(displayedProgress, loadingProgress, 0.1);
    
    // Ensure displayedProgress reaches 100 eventually
    if (loadingProgress >= 95 && displayedProgress < 95) {
      displayedProgress += 0.5;
    }
    
    // Set up loading bar dimensions
    let barWidth = canvasWidth * 0.5;
    let barHeight = canvasHeight * 0.05;
    let barX = (canvasWidth - barWidth) / 2;
    let barY = canvasHeight / 2;
    
    // Draw game title
    fill(30);
    textSize(barHeight * 3);
    textAlign(CENTER, CENTER);
    text("Liar's Bar", canvasWidth / 2, barY - barHeight * 6);
    
    // Draw loading phase text
    textSize(barHeight * 1.2);
    fill(30);
    text(loadingPhases[currentLoadingPhase], canvasWidth / 2, barY - barHeight * 2);
    
    // Draw loading percentage
    textSize(barHeight);
    text(floor(displayedProgress) + "%", canvasWidth / 2, barY + barHeight * 2.5);
    
    // Draw loading bar border
    stroke(30);
    strokeWeight(2);
    noFill();
    rect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, barHeight / 2 + 2);
    
    // Draw loading bar background
    fill(220);
    noStroke();
    rect(barX, barY, barWidth, barHeight, barHeight / 2);
    
    // Draw loading progress
    fill(30, 144, 255); // Dodger blue
    rect(barX, barY, barWidth * (displayedProgress / 100), barHeight, barHeight / 2);
    
    // Add some animation dots
    fill(30);
    let dotSize = barHeight * 0.3;
    let dotCount = 3;
    let dotSpacing = dotSize * 2;
    let dotsWidth = dotCount * dotSize + (dotCount - 1) * dotSpacing;
    let dotsX = canvasWidth / 2 - dotsWidth / 2;
    let dotsY = barY + barHeight * 4;
    
    for (let i = 0; i < dotCount; i++) {
      let dotX = dotsX + i * (dotSize + dotSpacing);
      // Make dots pulsate
      let pulseSize = dotSize * (0.8 + 0.4 * sin(frameCount * 0.1 + i * 0.7));
      ellipse(dotX, dotsY, pulseSize, pulseSize);
    }
  }
  
  // Start a new round
  function startNewRound() {
    let activePlayers = players.filter(p => p.active);
    if (activePlayers.length <= 1) {
      gamePhase = "end";
      if (activePlayers.length === 1) {
        message = `${activePlayers[0].label} wins!`;
      } else {
        message = "All players are eliminated!";
      }
      return;
    }
  
    // Create and shuffle deck
    let deck = createDeck();
    deck = shuffleArray(deck);
    
    // Ensure each player has a unique profile image
    usedProfileIndices = [players[0].profileIndex]; // Human player's avatar
    let availableIndices = [0, 1, 2, 3].filter(idx => idx !== players[0].profileIndex);
    
    // Assign profile images to bots
    for (let i = 1; i < players.length; i++) {
      // If bot doesn't have a profile index or has one that clashes with used indices
      if (!players[i].hasOwnProperty('profileIndex') || usedProfileIndices.includes(players[i].profileIndex)) {
        const newIndex = availableIndices.shift();
        players[i].profileIndex = newIndex;
        usedProfileIndices.push(newIndex);
      } else {
        usedProfileIndices.push(players[i].profileIndex);
        // Remove this index from available ones
        availableIndices = availableIndices.filter(idx => idx !== players[i].profileIndex);
      }
    }
  
    // Deal 5 cards to each active player
    let index = 0;
    for (let player of players) {
      if (player.active) {
        player.hand = [];
        for (let i = 0; i < 5; i++) {
          player.hand.push(deck[index]);
          index++;
        }
      }
    }
  
    // Set card of the table
    cardOfTable = random(["Ace", "King", "Queen"]);
    currentPlayer = activePlayers[floor(random(activePlayers.length))].id;
    playedCards = [];
    lastPlayedBy = null;
    selectedCards = [];
    message = "Game started!";
    gamePhase = "playing";
  }
  
  // Create the deck
  function createDeck() {
    let deck = [];
    for (let i = 0; i < 6; i++) {
      deck.push("Ace");
      deck.push("King");
      deck.push("Queen");
    }
    for (let i = 0; i < 2; i++) {
      deck.push("Joker");
    }
    return deck;
  }
  
  // Shuffle an array - renamed to avoid conflict with p5.js
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = floor(random(i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Bot's turn logic
  function botAction() {
    let player = players[currentPlayer];
    
    // Check if there's a last played card and decide whether to call bluff
    if (lastPlayedBy !== null) {
      // Base chance to call bluff
      let bluffCallChance = 0.2; // 20% base chance
      
      // Increase chance based on how many cards were played
      if (playedCards.length >= 4) {
        bluffCallChance = 0.99; // 99% chance to call bluff if 4 or more cards
      } else if (playedCards.length === 3) {
        bluffCallChance = 0.7; // 70% chance if 3 cards
      } else if (playedCards.length === 2) {
        bluffCallChance = 0.4; // 40% chance if 2 cards
      }
      
      if (random() < bluffCallChance) {
        playerCallsBluff(currentPlayer);
        return;
      }
    }
    
    // If we didn't call bluff, play cards
    if (player.hand.length > 0) {
      // Decide how many cards to play
      let maxCardsToPlay = min(player.hand.length, 5); // Maximum of 5 cards or all cards in hand
      
      // Distribution: more likely to play fewer cards
      let cardCounts = [1, 1, 1, 1, 2, 2, 3]; // 4/7 chance for 1 card, 2/7 for 2 cards, 1/7 for 3 cards
      let cardsToPlay = min(cardCounts[floor(random(cardCounts.length))], maxCardsToPlay);
      
      // Very small chance to play 4 or 5 cards (risky move)
      if (maxCardsToPlay >= 4 && random() < 0.05) { // 5% chance for 4 cards
        cardsToPlay = 4;
      } else if (maxCardsToPlay >= 5 && random() < 0.02) { // 2% chance for 5 cards
        cardsToPlay = 5;
      }
      
      // Select random cards to play
      let cardIndices = [];
      for (let i = 0; i < cardsToPlay; i++) {
        // Find a card index that hasn't been selected yet
        let cardIndex;
        do {
          cardIndex = floor(random(player.hand.length));
        } while (cardIndices.includes(cardIndex));
        
        cardIndices.push(cardIndex);
      }
      
      playerPlaysCards(currentPlayer, cardIndices);
    }
  }
  
  // Player plays cards
  function playerPlaysCards(playerIndex, cardIndices) {
    let player = players[playerIndex];
    let cards = cardIndices.map(i => player.hand[i]);
    playedCards = cards;
    player.hand = player.hand.filter((_, i) => !cardIndices.includes(i));
    lastPlayedBy = playerIndex;
    message = `${player.label} played ${cards.length} card(s).`;
    
    // Play the appropriate card sounds
    playCardSound(cards.length, cardOfTable);
    
    // Add delay for bot actions to ensure sound plays completely before next action
    if (players[(playerIndex - 1 + 4) % 4].type === 'bot') {
      // Reset action timer to add delay before next bot plays
      actionTimer = frameCount;
    }
    
    nextPlayer();
  }
  
  // Player declares liar
  function playerCallsBluff(playerIndex) {
    message = `${players[playerIndex].label} declares ${players[lastPlayedBy].label} a liar!`;
    
    // Play a random liar sound
    playLiarSound();
    
    gamePhase = "revealing";
    actionTimer = frameCount;
  }
  
  // Helper function to play a random liar sound using HTML audio elements
  function playLiarSound() {
    try {
      // Get all available liar sound elements
      const soundFiles = ['liar.mp3', 'bull shit.mp3','call out.mp3'];
      const randomIndex = Math.floor(Math.random() * soundFiles.length);
      const soundFile = soundFiles[randomIndex];
      
      // Create a new audio element for each play to avoid issues
      const audio = new Audio(`assets/sounds/liar/${soundFile}`);
      audio.volume = 0.7; // Set volume to 70%
      
      // Play the sound
      audio.play()
        .catch(error => {
          console.warn("Error playing sound:", error);
        });
    } catch (e) {
      console.warn("Exception playing liar sound:", e);
    }
  }
  
  // Helper function to play card sounds based on number of cards and card of table
  function playCardSound(numberOfCards, cardOfTableType) {
    try {
      // Validate inputs
      if (numberOfCards < 1 || numberOfCards > 5) {
        console.warn("Invalid number of cards for sound:", numberOfCards);
        return;
      }
      
      // Normalize card type for filename (lowercase)
      const cardType = cardOfTableType.toLowerCase();
      if (!['ace', 'king', 'queen'].includes(cardType)) {
        console.warn("Invalid card type for sound:", cardType);
        return;
      }
      
      // First play the number sound
      const numberAudio = new Audio(`assets/sounds/play/${numberOfCards}.mp3`);
      numberAudio.volume = 0.7;
      
      // Create card type audio but don't play it yet
      const cardAudio = new Audio(`assets/sounds/play/${cardType}.mp3`);
      cardAudio.volume = 0.7;
      
      // Fallback timeout in case the ended event doesn't fire
      let playCardTimeout;
      
      // Function to play the second sound
      const playSecondSound = () => {
        // Clear the timeout if it exists
        if (playCardTimeout) clearTimeout(playCardTimeout);
        
        // Play the card type sound
        cardAudio.play()
          .catch(error => {
            console.warn("Error playing card type sound:", error);
          });
      };
      
      // Play number sound first
      numberAudio.play()
        .then(() => {
          // Add event listener to play card sound when the number sound ends
          numberAudio.addEventListener('ended', playSecondSound);
          
          // Set a fallback timeout based on audio duration or a reasonable default (1 second)
          const estimatedDuration = numberAudio.duration || 1;
          playCardTimeout = setTimeout(playSecondSound, estimatedDuration * 1000 + 100);
        })
        .catch(error => {
          console.warn("Error playing number sound:", error);
          // Try to play the card sound anyway after a short delay
          setTimeout(playSecondSound, 500);
        });
    } catch (e) {
      console.warn("Exception playing card sounds:", e);
    }
  }
  
  // Resolve the liar declaration
  function resolveDeclaration() {
    let isTruth = playedCards.every(card => card === cardOfTable || card === "Joker");
    let loser;
    if (isTruth) {
      loser = currentPlayer;
      message = `${players[lastPlayedBy].label} was truthful! ${players[currentPlayer].label} must play roulette.`;
    } else {
      loser = lastPlayedBy;
      message = `${players[lastPlayedBy].label} lied! They must play roulette.`;
    }
    gamePhase = "roulette";
    playRoulette(players[loser]);
  }
  
  // Simulate roulette
  function playRoulette(player) {
    rouletteTargetPlayer = player.id;
    actionTimer = frameCount;
    
    // Actual result will be determined when the animation finishes in finalizeRoulette()
    message = `${player.label} is playing roulette...`;
    
    // Start finalizing the roulette outcome immediately
    setTimeout(finalizeRoulette, 2000);
  }
  
  // Move to the next active player (anti-clockwise)
  function nextPlayer() {
    do {
      currentPlayer = (currentPlayer - 1 + 4) % 4;
    } while (!players[currentPlayer].active);
  }
  
  // Handle mouse clicks
  function mousePressed() {
    if (gamePhase === "playing" && currentPlayer === 0) {
      let cardWidth = min(canvasWidth * 0.08, 70);
      let cardHeight = cardWidth * 1.4;
      let playerSize = min(canvasWidth, canvasHeight) * 0.1;
      let spacing = min(canvasWidth, canvasHeight) * 0.02;
      
      // Card selection for human player
      if (players[0].active) {
        // Calculate positions using horizontal layout - same calculations as in draw function
        let availableWidth = canvasWidth * 0.75;
        let cardOverlapRatio = min(0.8, max(0.3, 1 - (players[0].hand.length * cardWidth / availableWidth)));
        
        let handWidth = players[0].hand.length * cardWidth * cardOverlapRatio;
        let startX = (canvasWidth - handWidth) / 2;
        let bottomY = canvasHeight - playerSize * 0.7;
        
        // Check each card in the horizontal layout
        for (let i = 0; i < players[0].hand.length; i++) {
          let x = startX + i * (cardWidth * cardOverlapRatio);
          let y = bottomY - cardHeight - spacing * 2;
          
          if (mouseX > x && mouseX < x + cardWidth && mouseY > y && mouseY < y + cardHeight) {
            if (selectedCards.includes(i)) {
              selectedCards = selectedCards.filter(j => j !== i);
            } else {
              selectedCards.push(i);
            }
          }
        }
      }
      
      // Buttons
      let buttonWidth = canvasWidth * 0.15;
      let buttonHeight = canvasHeight * 0.05;
      let buttonY = canvasHeight * 0.95;
      
      // Play Selected button
      if (selectedCards.length > 0 && 
          mouseX > canvasWidth * 0.35 - buttonWidth/2 && 
          mouseX < canvasWidth * 0.35 + buttonWidth/2 && 
          mouseY > buttonY - buttonHeight && 
          mouseY < buttonY) {
        playerPlaysCards(0, selectedCards);
        selectedCards = [];
      }
      
      // Declare Liar button
      if (lastPlayedBy !== null && 
          mouseX > canvasWidth * 0.65 - buttonWidth/2 && 
          mouseX < canvasWidth * 0.65 + buttonWidth/2 && 
          mouseY > buttonY - buttonHeight && 
          mouseY < buttonY) {
        playerCallsBluff(0);
      }
    }
    
    // Check if settings icon is clicked
    let iconSize = min(canvasWidth, canvasHeight) * 0.04;
    let iconX = canvasWidth - iconSize * 1.5;
    let iconY = iconSize * 1.5;
    
    if (dist(mouseX, mouseY, iconX, iconY) < iconSize/2) {
      showSettings = !showSettings;
      return;
    }
    
    // Handle settings panel interactions
    if (showSettings) {
      let fontSize = min(canvasWidth, canvasHeight) * 0.025;
      let panelWidth = canvasWidth * 0.3;
      let panelHeight = canvasHeight * 0.5;
      let panelX = canvasWidth - panelWidth - iconSize;
      let panelY = iconSize * 3;
      
      // Close button
      let closeSize = fontSize;
      let closeX = panelX + panelWidth - closeSize;
      let closeY = panelY + closeSize;
      
      if (dist(mouseX, mouseY, closeX, closeY) < closeSize/2) {
        showSettings = false;
        return;
      }
      
      // Profile color selection
      let profileSize = min(panelWidth * 0.15, panelHeight * 0.15);
      let startProfileX = panelX + fontSize;
      let profileY = panelY + fontSize * 5.5;
      
      for (let i = 0; i < profileImages.length; i++) {
        let profileX = startProfileX + i * (profileSize * 1.3);
        
        if (dist(mouseX, mouseY, profileX + profileSize/2, profileY + profileSize/2) < profileSize/2) {
          selectedProfileIndex = i;
        }
      }
      
      // Apply button
      let buttonWidth = panelWidth * 0.5;
      let buttonHeight = fontSize * 2;
      let buttonX = panelX + (panelWidth - buttonWidth) / 2;
      let buttonY = panelY + panelHeight - buttonHeight - fontSize * 2;
      
      if (mouseX > buttonX && mouseX < buttonX + buttonWidth && 
          mouseY > buttonY && mouseY < buttonY + buttonHeight) {
        // Only allow changing avatar between rounds
        if (gamePhase !== "playing" || playedCards.length === 0) {
          // Store previous profile index to update other players if needed
          const oldProfileIndex = players[0].profileIndex;
          
          // Apply the selected profile image
          players[0].profileIndex = selectedProfileIndex;
          
          // Update usedProfileIndices
          usedProfileIndices = [selectedProfileIndex]; 
          
          // Reassign profile indices for bots to ensure they don't use the same as the player
          let availableIndices = [0, 1, 2, 3].filter(idx => idx !== selectedProfileIndex);
          for (let i = 1; i < players.length; i++) {
            // If bot already has a valid index that's not the player's new one, keep it
            if (players[i].profileIndex !== selectedProfileIndex) {
              usedProfileIndices.push(players[i].profileIndex);
              availableIndices = availableIndices.filter(idx => idx !== players[i].profileIndex);
            } else {
              // Bot needs a new avatar
              const newIndex = availableIndices.shift();
              players[i].profileIndex = newIndex;
              usedProfileIndices.push(newIndex);
            }
          }
        }
      }
    }
  }
  
  // Function to draw a card based on its type
  function drawCard(cardType, x, y, width, height) {
    if (cardImages[cardType]) {
      // Calculate aspect ratio to prevent stretching
      let imgAspectRatio = cardImages[cardType].width / cardImages[cardType].height;
      let containerAspectRatio = width / height;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider than container (relative to height)
        drawWidth = width;
        drawHeight = drawWidth / imgAspectRatio;
        offsetY = (height - drawHeight) / 2;
      } else {
        // Image is taller than container (relative to width)
        drawHeight = height;
        drawWidth = drawHeight * imgAspectRatio;
        offsetX = (width - drawWidth) / 2;
      }
      
      image(cardImages[cardType], x + offsetX, y + offsetY, drawWidth, drawHeight);
    } else {
      // Fallback if image doesn't exist
      fill(255);
      rect(x, y, width, height);
      fill(0);
      text(cardType, x + width/2, y + height/2);
    }
  }
  
  // Function to get a position relative to the table edge in the direction of a player
  function getPositionRelativeToTable(playerId, distance, offsetFactor) {
    let tableRadius = min(canvasWidth, canvasHeight) * 0.3;
    let tableCenterX = canvasWidth / 2;
    let tableCenterY = canvasHeight / 2;
    
    // Get player position
    let player = players.find(p => p.id === playerId);
    if (!player) return {x: 0, y: 0};
    
    let xPos = player.pos[0] * canvasWidth;
    let yPos = player.pos[1] * canvasHeight;
    
    // Calculate direction from table center to player
    let dirX = xPos - tableCenterX;
    let dirY = yPos - tableCenterY;
    let angle = atan2(dirY, dirX);
    
    // Apply offset angle if specified
    if (offsetFactor) {
      let offsetAngle = offsetFactor * PI;
      if (playerId === 1) angle += offsetAngle; // Right player
      else if (playerId === 2) angle += offsetAngle; // Top player
      else if (playerId === 3) angle -= offsetAngle; // Left player
      else angle -= offsetAngle; // Bottom player
    }
    
    // Calculate position
    let x = tableCenterX + cos(angle) * (tableRadius + distance);
    let y = tableCenterY + sin(angle) * (tableRadius + distance);
    
    return {x, y};
  }
  
  // Function to finalize the roulette spin
  function finalizeRoulette() {
    let player = players[rouletteTargetPlayer];
    
    if (player.pulls < 5) {
      let chance = 1 / (6 - player.pulls); // Probability of dying
      let died = random() < chance;
      
      if (died) {
        player.active = false;
        message += `\n${player.label} is eliminated!`;
        // Play eliminated sound
        playRouletteSound(false);
      } else {
        player.pulls += 1;
        message += `\n${player.label} survived!`;
        // Play survived sound
        playRouletteSound(true);
      }
    } else {
      player.active = false;
      message += `\n${player.label} is eliminated!`;
      // Play eliminated sound
      playRouletteSound(false);
    }
    
    // Start a new round after a short delay
    actionTimer = frameCount;
    setTimeout(startNewRound, 2000);
  }
  
  // Helper function to play roulette sounds (survived or eliminated)
  function playRouletteSound(survived) {
    try {
      // Choose the appropriate sound file
      const soundFile = survived ? 'survived.mp3' : 'eliminated.mp3';
      
      // Create a new audio element
      const audio = new Audio(`assets/sounds/shotin/${soundFile}`);
      audio.volume = 0.7; // Set volume to 70%
      
      // Play the sound
      audio.play()
        .catch(error => {
          console.warn(`Error playing ${soundFile} sound:`, error);
        });
    } catch (e) {
      console.warn("Exception playing roulette sound:", e);
    }
  }
  
  // Function to draw individual player revolvers
  function drawPlayerRevolver(player) {
    if (!revolverImage) return;
    
    // Calculate position near the player
    let xPos = player.pos[0] * canvasWidth;
    let yPos = player.pos[1] * canvasHeight;
    
    // Position the revolver based on player position
    let revolverPositionX, revolverPositionY;
    let revolverWidth = playerSize * 0.8;
    let revolverHeight = revolverWidth * (revolverImage.height / revolverImage.width);
    
    // Calculate 90-degree offset angle for each player position
    let baseAngle;
    if (player.id === 0) baseAngle = -PI/2; // Bottom player (upward)
    else if (player.id === 1) baseAngle = PI; // Right player (leftward)
    else if (player.id === 2) baseAngle = PI/2; // Top player (downward)
    else baseAngle = 0; // Left player (rightward)
    
    // Position revolver next to player
    let revolverOffset = playerSize * 0.8;
    revolverPositionX = xPos + cos(baseAngle) * revolverOffset;
    revolverPositionY = yPos + sin(baseAngle) * revolverOffset;
    
    push();
    translate(revolverPositionX, revolverPositionY);
    
    // Apply rotation animation for player's revolver
    rotate(baseAngle + player.revolverAngle);
    
    // Draw revolver
    imageMode(CENTER);
    image(revolverImage, 0, 0, revolverWidth, revolverHeight);
    imageMode(CORNER);
    pop();
    
    // Animate player's revolver slowly
    player.revolverAngle += 0.003;
  }