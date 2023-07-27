import AnimationKeys from "../consts/AnimationKeys"
import SceneKeys from "../consts/SceneKeys"
import TextureKeys from "../consts/TextureKeys"

enum MouseState {
  Running,
  Killed,
  Dead
}

export default class RocketMouse extends Phaser.GameObjects.Container {
  private mouseState = MouseState.Running
  private flames: Phaser.GameObjects.Sprite
  private mouse: Phaser.GameObjects.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    // 🚀🐭
    this.mouse = scene.add.sprite(0, 0, TextureKeys.RocketMouse).setOrigin(0.5, 1).play(AnimationKeys.RocketMouseRun)

    // 🔥
    this.flames = scene.add.sprite(-63, -15, TextureKeys.RocketMouse).play(AnimationKeys.RocketFlamesOn)

    // 创建系列动画
    this.createAnimations()
    
    this.mouse.play(AnimationKeys.RocketMouseRun)
    this.mouse.play(AnimationKeys.RocketFlamesOn)

    // 关闭🔥喷射器
    this.enableJetpack(false)
    
    // 这里的次序很重要，先加载 🔥 再加载 🐭，保证 🔥 在 🎒 的后面
    this.add(this.flames)
    this.add(this.mouse)

    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    // 🐭 物理盒大小、尺寸
    body.setSize(this.mouse.width * 0.5, this.mouse.height * 0.7)
    body.setOffset(this.mouse.width * -0.3, -this.mouse.height + 15)

    // 键盘光标
    this.cursors = scene.input.keyboard.createCursorKeys()

    // scene.input.on('pointerup', () => this.fly())
  }

  enableJetpack(enabled: boolean) {
    this.flames.setVisible(enabled)
  }

  preUpdate() { 
    const body = this.body as Phaser.Physics.Arcade.Body
    switch (this.mouseState) {
      case MouseState.Running: {
        // 空格键是否被按下
        const { isDown } = this.cursors.space
    
        body.setAccelerationY(isDown ? -600 : 0)
        this.enableJetpack(isDown)
    
        if (body.blocked.down) {
          this.mouse.play(AnimationKeys.RocketMouseRun, true)
        } else if (body.velocity.y > 0) {
          this.mouse.play(AnimationKeys.RocketMouseFall, true)
        }
        break
      }
        
      case MouseState.Killed: {
        body.velocity.x *= 0.99

        if (body.velocity.x < 5) {
          this.mouseState = MouseState.Dead
        }
        break
      }
        
      case MouseState.Dead: {
        body.setVelocity(0, 0)
        this.scene.scene.run(SceneKeys.GameOver)
        break
      }
    
      default:
        break;
    }
  }

  kill() {
    if (this.mouseState !== MouseState.Running) {
      return
    }

    this.mouseState = MouseState.Killed

    this.mouse.play(AnimationKeys.RocketMouseDead)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAccelerationY(0)
    body.setVelocity(1000, 0)
    this.enableJetpack(false)
  }

  private createAnimations() {
    this.mouse.anims.create({
			key: AnimationKeys.RocketMouseRun,
			frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
				start: 1,
				end: 4,
				prefix: 'rocketmouse_run',
				zeroPad: 2,
				suffix: '.png',
			}),
			frameRate: 10,
			repeat: -1,
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketFlamesOn,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'flame',
        suffix: '.png'
      }),
      frameRate: 10,
      repeat: -1,
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFall,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fall01.png'
      }]
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFly,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fly01.png'
      }]
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseDead,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'rocketmouse_dead',
        zeroPad: 2,
        suffix: '.png'
      }),
      frameRate: 10
    })
    
  }
}