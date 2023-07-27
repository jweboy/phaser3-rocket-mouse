import Phaser from 'phaser'
import SceneKeys from '../consts/SceneKeys';
import TextureKeys from '../consts/TextureKeys';
import RocketMouse from '../game/RocketMouse';
import LaserObstacle from '../game/LaserObstacle';

export default class Game extends Phaser.Scene {
	private background!: Phaser.GameObjects.TileSprite
	private mouseHole!: Phaser.GameObjects.Image
	private window1!: Phaser.GameObjects.Image
	private window2!: Phaser.GameObjects.Image
	private bookcase1!: Phaser.GameObjects.Image
	private bookcase2!: Phaser.GameObjects.Image

	private laserObstacle!: LaserObstacle
	private coins!: Phaser.Physics.Arcade.StaticGroup

	private scoreLabel!: Phaser.GameObjects.Text
	private score = 0
	
	private mouse!: RocketMouse

	private windows: Phaser.GameObjects.Image[] = []
	private bookcases: Phaser.GameObjects.Image[] = []

	constructor() {
		super(SceneKeys.Game)
	}

	init() {
		this.score = 0
	}

	create() {
		const { width, height } = this.scale;

		// 背景图
		this.background = this.add.tileSprite(0, 0, width, height, TextureKeys.Background)
		.setOrigin(0, 0)
			.setScrollFactor(0, 0)
		
		// 老鼠洞
		this.mouseHole = this.add.image(Phaser.Math.Between(900, 1500), 501, TextureKeys.MouseHole)

		// 窗户1
		this.window1 = this.add.image(Phaser.Math.Between(900, 1300), 200, TextureKeys.Window1)

		// 窗户2
		this.window2 = this.add.image(Phaser.Math.Between(1600, 2000), 200, TextureKeys.Window2)

		// 书柜1
		this.bookcase1 = this.add.image(Phaser.Math.Between(2200, 2700), 580, TextureKeys.Bookcase1).setOrigin(0.5, 1)

		// 书柜2
		this.bookcase2 = this.add.image(Phaser.Math.Between(2900, 3400), 580, TextureKeys.Bookcase2).setOrigin(0.5, 1)

		this.windows = [this.window1, this.window2]
		this.bookcases = [this.bookcase1, this.bookcase2]

		// 激光障碍
		this.laserObstacle = new LaserObstacle(this, 900, 100)
		this.add.existing(this.laserObstacle)

		// 金币组
		this.coins = this.physics.add.staticGroup()
		this.spawnCoins()

		// 火箭鼠
		this.mouse = new RocketMouse(this, width * 0.5, height - 30)
		this.add.existing(this.mouse)

		const body = this.mouse.body as Phaser.Physics.Arcade.Body
		body.setCollideWorldBounds(true)
		// 运动速度
		body.setVelocityX(200)

		// 分数
		this.scoreLabel = this.add.text(0, 0,` Scope: ${this.score}`,  {
			fontSize: '24px',color: '#080808',  backgroundColor: '#F8E71C',  shadow: { fill: true, blur: 0, offsetY: 0 },
			padding: { left: 15, right: 15, top: 10, bottom: 10 }
		})
			// 保持原位不随视角一起滚动
			.setScrollFactor(0)

		// 物理世界边界
		this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height - 55)
		// 相机视角
		this.cameras.main.startFollow(this.mouse)
		this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height)

		// 触碰激光线
		this.physics.add.overlap(this.laserObstacle, this.mouse, this.handleOverlaserObstacle, undefined, this)

		// 收集金币
		this.physics.add.overlap(this.coins, this.mouse, this.handleCollectCoin, undefined, this)
	}

	private teleportBackwards() {
		const { scrollX } = this.cameras.main
		const maxX = 2380
		
		// 移动的距离超出限制 
		if (scrollX > maxX) {
			this.mouse.x -= maxX
			this.mouseHole.x -= maxX

			// 传送窗
			this.windows.forEach(win => {
				win.x -= maxX
			})

			// 传送书柜
			this.bookcases.forEach(bookcase => {
				bookcase.x -= maxX
			})

			this.laserObstacle.x -= maxX
			const laserBody = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody
			laserBody.x -= maxX

			this.spawnCoins()
			// 传送金币
			this.coins.children.each(child => {
				const coin = child as Phaser.Physics.Arcade.Sprite
				if (!coin.active) {
					return
				}

				coin.x -= maxX
				const body = coin.body as Phaser.Physics.Arcade.StaticBody
				body.updateFromGameObject()
			})
		}
	}
	

	// 产出金币
	spawnCoins() { 
		this.coins.children.each((child) => {
			const coin = child as Phaser.Physics.Arcade.Sprite
			this.coins.killAndHide(coin)
			coin.body.enable = false
		})

		const { scrollX } = this.cameras.main
		const rightEdge = scrollX + this.scale.width

		let x = rightEdge + 100

		const numCoins = Phaser.Math.Between(1, 20)

		for (let i = 0; i < numCoins; i++) {
			const coin = this.coins.get(x, Phaser.Math.Between(100, this.scale.height - 100), TextureKeys.Coin) as Phaser.Physics.Arcade.Sprite

			coin.setVisible(true)
			coin.setActive(true)

			const body = coin.body as Phaser.Physics.Arcade.StaticBody
			body.setCircle(body.width * 0.5)
			body.enable = true
			body.updateFromGameObject()
			
			x += coin.width * 1.5
		}
	}

	// 收集金币
	private handleCollectCoin(_: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
		const coin = obj2 as Phaser.Physics.Arcade.Sprite
		// 隐藏金币
		this.coins.killAndHide(coin)
		coin.body.enable = false

		// 获取得分
		this.score += 1
		// 刷新分数
		this.scoreLabel.text = `Scope: ${this.score}`
	}

	// 激光触电
	handleOverlaserObstacle(_: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
		const mouse = obj2 as RocketMouse

		mouse.kill()
	}

	update() {
		this.wrapMouseHole()
		this.wrapWindows()
		this.wrapBookcases()
		this.wrapLaserObtacle()
		this.background.setTilePosition(this.cameras.main.scrollX)
		this.teleportBackwards()
	}

	private wrapMouseHole() {
		const { scrollX } = this.cameras.main;
		const rightEdge = scrollX + this.scale.width;

		if (this.mouseHole.x + this.mouseHole.width < scrollX) {
			this.mouseHole.x = Phaser.Math.Between(
				rightEdge + 100,
				rightEdge + 1000
			)
		}
	}

	private wrapWindows() {
		const { scrollX } = this.cameras.main;
		const rightEdge = scrollX + this.scale.width;
		let width = this.window1.width * 2

		if (this.window1.x + width < scrollX) {
			this.window1.x = Phaser.Math.Between(
				rightEdge + width,
				rightEdge + width + 800
			)

			const overlap = this.bookcases.find(bookcase => {
				return Math.abs(this.window1.x - bookcase.x) <= this.window1.width
			})

			this.window1.visible = !overlap
		}

		width = this.window2.width
		if (this.window2.x + width < scrollX) {
			this.window2.x = Phaser.Math.Between(
				this.window1.x + width,
				this.window1.x + width + 800
			)

			const overlap = this.bookcases.find(bookcase => {
				return Math.abs(this.window2.x - bookcase.x) <= this.window2.width
			})

			this.window2.visible = !overlap
		}
	}

	private wrapBookcases() {
		const { scrollX } = this.cameras.main;
		const rightEdge = scrollX + this.scale.width;
		let width = this.bookcase1.width * 2

		if (this.bookcase1.x + width < scrollX) {
			this.bookcase1.x = Phaser.Math.Between(
				rightEdge + width,
				rightEdge + width + 800
			)

			const overlap = this.windows.find(win => {
				return Math.abs(this.bookcase1.x - win.x) <= win.width
			})

			this.bookcase1.visible = !overlap
		}

		width = this.bookcase2.width
		if (this.bookcase2.x + width < scrollX) {
			this.bookcase2.x = Phaser.Math.Between(
				rightEdge + width,
				rightEdge + width + 800
			)
			const overlap = this.windows.find(win => {
				return Math.abs(this.bookcase2.x - win.x) <= win.width
			})

			this.bookcase2.visible = !overlap
			// 间隔产生金币
			// this.spawnCoins()
		}
	}

	private wrapLaserObtacle() {
		const { scrollX } = this.cameras.main;
		const rightEdge = scrollX + this.scale.width;
		const width = this.laserObstacle.width
		const body = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody

		if (this.laserObstacle.x + width < scrollX) {
			this.laserObstacle.x = Phaser.Math.Between(
				rightEdge + width,
				rightEdge + width + 1000
			)

			this.laserObstacle.y = Phaser.Math.Between(0, 300)

			body.position.x = this.laserObstacle.x + body.offset.x
			body.position.y = this.laserObstacle.y
		}
	}
}