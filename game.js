const WIDTH = 160;
const HEIGHT = 120;
const ZOOM = 4; // fixed 4x scale instead of dynamic

let gameInstance = null; // To hold the Phaser game instance

function startGame(parentElementId) {
  if (gameInstance) {
    console.warn("Game already running.");
    return;
  }

  const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x90b5c6,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: ZOOM,
    },
    physics: {
      default: "arcade",
    },
    render: {
      pixelArt: true,
      antialias: false,
    },
    scene: {
      preload,
      create,
      update,
    },
    parent: parentElementId, // Specify the parent DOM element ID
  };

  gameInstance = new Phaser.Game(config);
}

function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
}

// Make startGame and destroyGame globally accessible if game.js is loaded directly
// or use module exports if you're using a module bundler.
// For this scenario, we'll attach them to the window object.
window.startGame = startGame;
window.destroyGame = destroyGame;

function preload() {
  this.load.image("chicken", "Images/Chicken.png");
  this.load.image("egglaying", "Images/egglaying.png");
  this.load.image("egg", "Images/Egg.png");
  this.load.image("chick", "Images/Chick.png");
  this.load.spritesheet("hatching", "Images/hatching.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
}

function create() {
  const scene = this;
  this.score = 0;

  ["chicken", "egglaying", "egg", "chick"].forEach((key) =>
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
  );

  this.menu = true;
  this.selectedButton = 0;
  this.loading = false;

  this.eggs = this.add.group();
  this.chickens = this.add.group();

  this.mrsChicken = this.add.sprite(35, 60, "chicken").setScale(4).setDepth(2);
  this.chickens.add(this.mrsChicken);

  const menuFont = {
    fontFamily: "Minecraftia",
    fontSize: "8px",
    color: "#FFFFFF",
  };
  const scoreFont = {
    fontFamily: "Minecraftia",
    fontSize: "8px",
    color: "#C98D3F",
  };

  this.title1 = this.add
    .text(110, 30, "Happy Mrs. Chicken", menuFont)
    .setOrigin(0.5);
  this.title2 = this.add.text(110, 44, "Remaster!", menuFont).setOrigin(0.5);
  this.startText = this.add.text(110, 68, "<Start>", menuFont).setOrigin(0.5);
  this.creditsText = this.add.text(110, 82, "Credits", menuFont).setOrigin(0.5);

  // Score background with crisp orange bottom+left border
  this.scoreBg = this.add.graphics().setDepth(4).setScrollFactor(0);
  this.scoreBg.visible = false;

  this.drawScoreBox = (width) => {
    const fillColor = 0xf5efe8;
    const borderColor = 0xc98d3f;
    const boxHeight = 10;
    const x = WIDTH - width - 2;
    const y = 0;

    this.scoreBg.clear();
    this.scoreBg.setScrollFactor(0);
    this.scoreBg.setDepth(4);

    this.scoreBg.fillStyle(fillColor, 1);
    this.scoreBg.fillRect(
      Math.floor(x),
      Math.floor(y),
      Math.floor(width + 2),
      Math.floor(boxHeight)
    );

    this.scoreBg.fillStyle(borderColor, 1);
    this.scoreBg.fillRect(
      Math.floor(x),
      Math.floor(y + boxHeight - 1),
      Math.floor(width + 2),
      1
    );
    this.scoreBg.fillRect(
      Math.floor(x),
      Math.floor(y),
      1,
      Math.floor(boxHeight)
    );

    this.scoreBg.setVisible(true);
  };

  // Score text
  this.scoreText = this.add
    .text(WIDTH - 2, -1, "0", scoreFont)
    .setOrigin(1, 0)
    .setDepth(5)
    .setScrollFactor(0)
    .setVisible(false);

  // Keyboard controls
  this.keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.UP,
    down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    z: Phaser.Input.Keyboard.KeyCodes.Z,
    enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
  });

  this.input.keyboard.on("keydown-UP", () => {
    if (this.menu) {
      this.selectedButton = 0;
      this.startText.setText("<Start>");
      this.creditsText.setText("Credits");
    }
  });

  this.input.keyboard.on("keydown-DOWN", () => {
    if (this.menu) {
      this.selectedButton = 1;
      this.startText.setText("Start");
      this.creditsText.setText("<Credits>");
    }
  });

  this.input.keyboard.on("keydown-Z", () => this.handleA());
  this.input.keyboard.on("keydown-ENTER", () => this.handleA());
  this.input.on("pointerdown", () => this.handleA());

  // Define hatching animation
  this.anims.create({
    key: "hatch",
    frames: this.anims.generateFrameNumbers("hatching", {
      start: 0,
      end: 11,
    }),
    frameRate: 6,
    repeat: 0,
  });

  // Hatch event using spritesheet animation
  this.time.addEvent({
    delay: 10000,
    loop: true,
    callback: () => {
      if (!this.menu) {
        this.eggs.getChildren().forEach((egg) => {
          const x = egg.x;
          const y = egg.y;
          egg.destroy();

          const hatchAnim = scene.add
            .sprite(x, y, "hatching")
            .setDepth(2)
            .play("hatch");

          hatchAnim.on("animationcomplete", () => {
            hatchAnim.destroy();
            const chicken = scene.add.sprite(x, y, "chicken").setDepth(2);
            scene.chickens.add(chicken);
          });
        });
      }
    },
  });

  // Loading sprite
  this.loadingSprite = this.add
    .sprite(WIDTH - 12, HEIGHT - 12, "egg")
    .setVisible(false)
    .setDepth(10);
  this.loadingCam = this.cameras.add(0, 0, WIDTH, HEIGHT);
  this.loadingCam.setBackgroundColor(0x17111a);
  this.loadingCam.setVisible(false);
}

function handleMenu(scene) {
  scene.cameras.main.fadeOut(400, 23, 17, 26);
  scene.time.delayedCall(400, () => {
    scene.title1.setVisible(false);
    scene.title2.setVisible(false);
    scene.startText.setVisible(false);
    scene.creditsText.setVisible(false);
    scene.mrsChicken.destroy();

    scene.loadingSprite.setVisible(true);
    scene.loadingCam.setVisible(true);
    scene.loadingSprite.setDepth(10);

    const images = ["egg", "chick", "chicken"];
    let index = 0;
    const loops = 2;
    const steps = images.length * loops;

    const animTimer = scene.time.addEvent({
      delay: 500,
      repeat: steps - 1,
      callback: () => {
        scene.loadingSprite.setTexture(images[index]);
        index = (index + 1) % images.length;
      },
    });

    scene.time.delayedCall(500 * steps, () => {
      animTimer.remove(false);
      scene.loadingCam.fadeOut(400, 23, 17, 26);
      scene.time.delayedCall(400, () => {
        scene.loadingCam.setVisible(false);
        scene.loadingSprite.setVisible(false);
        scene.cameras.main.fadeIn(400, 23, 17, 26);

        const main = scene.add
          .sprite(WIDTH / 2, HEIGHT / 2, "chicken")
          .setDepth(2);
        scene.chickens.add(main);
        scene.menu = false;
        scene.loading = false;
        scene.score = 0;
        scene.scoreText.setText("0");
        scene.scoreText.setVisible(true);
        scene.drawScoreBox(scene.scoreText.width + 4);
      });
    });
  });
}

function handleGame(scene) {
  scene.chickens.getChildren().forEach((ch) => {
    ch.setTexture("egglaying");
    ch.x = Phaser.Math.Between(1, WIDTH - 1);
    ch.y = Phaser.Math.Between(1, HEIGHT - 1);

    const egg = scene.add.sprite(ch.x, ch.y, "egg").setDepth(1);
    scene.eggs.add(egg);

    scene.time.delayedCall(300, () => {
      ch.y -= 3;
      ch.setTexture("chicken");

      if (!scene.menu) {
        scene.score++;
        scene.scoreText.setText(scene.score);
        scene.drawScoreBox(scene.scoreText.width + 4);
      }
    });
  });
}

function update() {}

Phaser.Scene.prototype.handleA = function () {
  if (this.menu) {
    if (this.selectedButton === 0 && !this.loading) {
      handleMenu(this);
    } else if (this.selectedButton === 1) {
      this.cameras.main.flash(300, 255, 255, 255);

      const textFont = {
        fontFamily: "Minecraftia",
        fontSize: "8px",
        color: "#C98D3F",
      };

      const msg = this.add
        .text(WIDTH / 2, HEIGHT / 2, "Created by Sonicblaston", textFont)
        .setOrigin(0.5)
        .setDepth(999);

      // Draw background box behind text (styled like score box)
      const msgBg = this.add.graphics().setDepth(998);
      const padding = 3;
      const textWidth = msg.width + padding * 2;
      const textHeight = msg.height + padding * 2;
      const boxX = Math.floor(WIDTH / 2 - textWidth / 2);
      const boxY = Math.floor(HEIGHT / 2 - textHeight / 2);
      const fillColor = 0xf5efe8;
      const borderColor = 0xc98d3f;

      // Draw solid fill
      msgBg.fillStyle(fillColor, 1);
      msgBg.fillRect(boxX, boxY, textWidth, textHeight);

      // Draw full crisp border (top, bottom, left, right)
      msgBg.fillStyle(borderColor, 1);
      // Top
      msgBg.fillRect(boxX, boxY, textWidth, 1);
      // Bottom
      msgBg.fillRect(boxX, boxY + textHeight - 1, textWidth, 1);
      // Left
      msgBg.fillRect(boxX, boxY, 1, textHeight);
      // Right
      msgBg.fillRect(boxX + textWidth - 1, boxY, 1, textHeight);

      // Remove both after delay
      this.time.delayedCall(1500, () => {
        msg.destroy();
        msgBg.destroy();
      });
    }
  } else {
    handleGame(this);
  }
};
