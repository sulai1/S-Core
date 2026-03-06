declare module 'cropperjs' {
  export default class Cropper {
    constructor(element: HTMLElement, options?: Record<string, unknown>)
    destroy(): void
    reset(): void
    zoomTo(value: number): void
    rotateTo(deg: number): void
    getCroppedCanvas(options?: Record<string, unknown>): HTMLCanvasElement
    setCropBoxData(data: { left: number; top: number; width: number; height: number }): void
  }
}
