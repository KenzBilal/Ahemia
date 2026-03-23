export interface JoystickState {
  x: number;
  y: number;
  angle: number;
  magnitude: number;
  isActive: boolean;
}

export class VirtualJoystick {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private centerX: number;
  private centerY: number;
  private baseRadius: number;
  private stickRadius: number;
  private state: JoystickState;
  private touchId: number | null = null;
  private isDragging = false;

  constructor(canvas: HTMLCanvasElement, x: number, y: number, baseRadius: number = 50) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.centerX = x;
    this.centerY = y;
    this.baseRadius = baseRadius;
    this.stickRadius = baseRadius * 0.4;
    this.state = {
      x: 0,
      y: 0,
      angle: 0,
      magnitude: 0,
      isActive: false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const dx = touchX - this.centerX;
    const dy = touchY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.baseRadius * 1.5) {
      this.touchId = touch.identifier;
      this.isDragging = true;
      this.state.isActive = true;
      this.updateStickPosition(touchX, touchY);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (this.touchId === null) return;

    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touch = e.touches[i];
        break;
      }
    }

    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    this.updateStickPosition(touchX, touchY);
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.touchId === null) return;

    let touchFound = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touchFound = true;
        break;
      }
    }

    if (!touchFound) {
      this.touchId = null;
      this.isDragging = false;
      this.state.isActive = false;
      this.state.x = 0;
      this.state.y = 0;
      this.state.magnitude = 0;
    }
  }

  private updateStickPosition(touchX: number, touchY: number) {
    const dx = touchX - this.centerX;
    const dy = touchY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.baseRadius) {
      this.state.x = (dx / distance) * this.baseRadius;
      this.state.y = (dy / distance) * this.baseRadius;
      this.state.magnitude = 1;
    } else {
      this.state.x = dx;
      this.state.y = dy;
      this.state.magnitude = distance / this.baseRadius;
    }

    this.state.angle = Math.atan2(this.state.y, this.state.x);
  }

  getState(): JoystickState {
    return { ...this.state };
  }

  render() {
    // Draw base circle
    this.ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.baseRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw base circle border
    this.ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw stick
    const stickX = this.centerX + this.state.x;
    const stickY = this.centerY + this.state.y;

    this.ctx.fillStyle = this.isDragging ? "rgba(100, 150, 255, 0.6)" : "rgba(100, 100, 100, 0.5)";
    this.ctx.beginPath();
    this.ctx.arc(stickX, stickY, this.stickRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw stick border
    this.ctx.strokeStyle = this.isDragging ? "rgba(100, 150, 255, 1)" : "rgba(100, 100, 100, 0.8)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  setPosition(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
  }
}
