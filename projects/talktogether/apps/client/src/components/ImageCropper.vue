<template>
  <q-dialog
    v-model="show"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="cropper-card">
      <q-card-section class="cropper-card-section">
        <div class="cropper-container">
          <div class="cropper-layout">
            <div class="cropper-preview-panel">
              <img ref="imgRef" :src="src ?? ''" alt="to-crop" class="cropper-image" />
            </div>

            <div class="cropper-controls">
              <div class="control-actions flex-row">
                <q-btn size="sm" color="primary" label="Detect face" class="control-btn" @click="detectFace" />
                <q-btn size="sm" color="primary" outline label="Reset" class="control-btn" @click="resetCrop" />
              </div>

              <q-separator />

              <div class="control-group">
                <div class="text-subtitle2">Rotate</div>
                <q-slider :model-value="rotate" :min="-180" :max="180" :step="1" @update:model-value="onRotate" />
              </div>

              <div class="confirm-actions">
                <q-btn color="positive" label="Confirm crop" class="control-btn" @click="confirm" />
                <q-btn color="negative" label="Cancel" flat class="control-btn" @click="cancel" />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
// cropperjs types may be missing; suppress errors for the import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

// Add FaceDetector type for TypeScript
declare class FaceDetector {
  detect(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ boundingBox: { x: number, y: number, width: number, height: number } }>>;
}

const props = defineProps<{ src: string | null, show?: boolean, initRotate?: number }>()
const emit = defineEmits(['update:show', 'cropped'])
const $q = useQuasar()

const show = ref<boolean>(!!props.show)
watch(()=>props.show, v => show.value = !!v)
watch(show, v => emit('update:show', v))

const imgRef = ref<HTMLImageElement | null>(null)
let cropper: InstanceType<typeof Cropper> | null = null

const zoom = ref<number>(1)
const rotate = ref<number>(0)

onMounted(()=>{
  watch(()=>props.src, ()=>{
    // re-init cropper when src changes
    if(show.value) void nextTick(() => initCropper())
  }, {immediate:true})

  // re-init when dialog is shown (props.show mapped to local `show`)
  watch(show, (v) => {
    if(v) void nextTick(() => initCropper())
    else destroyCropper()
  }, { immediate: true })

  // apply initial rotation if provided
  watch(() => props.initRotate, (v) => {
    if (typeof v === 'number') {
      rotate.value = v
      if (cropper) try { cropper.rotateTo(v) } catch {/* ignore */}
    }
  }, { immediate: true })
})

onBeforeUnmount(()=>{
  destroyCropper()
})

function initCropper(){
  destroyCropper()
  if(!imgRef.value) return
  const img = imgRef.value

  const create = () => {
    try{
      cropper = new Cropper(img, {
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: true,
        rotatable: true,
        responsive: true,
        background: false,
      })
      // apply any requested initial transform
      try{
        if(typeof rotate.value === 'number' && rotate.value !== 0) cropper.rotateTo(rotate.value)
        if(typeof zoom.value === 'number' && zoom.value !== 1) cropper.zoomTo(zoom.value)
      }catch{/* ignore */}
    }catch(e){
      console.warn('Cropper init failed', e)
    }
  }

  // If image isn't loaded yet, wait for load event
  if(!img.complete || img.naturalWidth === 0){
    const handler = () => {
      img.removeEventListener('load', handler)
      create()
    }
    img.addEventListener('load', handler)
  }else{
    create()
  }
}

function destroyCropper(){
  if(cropper){
    try{ cropper.destroy() }catch{
      console.warn("Failed to destroy cropper")
    }
    cropper = null
  }
}

async function detectFace(){
  if(!imgRef.value || !cropper) return
  try{
    // use browser FaceDetector if available
    if('FaceDetector' in window){
        const fd = new FaceDetector()
        const img = imgRef.value
        const faces = await fd.detect(img )
      if(faces && faces.length > 0 && faces[0]?.boundingBox){
        const f = faces[0].boundingBox
        // convert bounding box to image natural coordinates
        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const left = f.x / scaleX
        const top = f.y / scaleY
        const width = f.width / scaleX
        const height = f.height / scaleY
        cropper.setCropBoxData({ left, top, width, height })
        return
      }
    }
  }catch(e){
    console.warn('FaceDetector failed', e)
  }
  // fallback: center square crop
    const img = imgRef.value
    if(!img) return
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const size = Math.min(iw, ih)
  const left = (iw - size)/2
  const top = (ih - size)/2
  cropper.setCropBoxData({ left, top, width: size, height: size })
}

function resetCrop(){
  cropper?.reset()
  zoom.value = 1
  rotate.value = 0
}


function onRotate(v: string | number | null){
  if(v == null) return
  const num = typeof v === 'string' ? Number(v) : v
  if (isNaN(num)) return
  rotate.value = num
  if(!cropper) return
  try{ cropper.rotateTo(num) }catch{/* ignore */}
}

async function confirm(){
  await new Promise(resolve => setTimeout(resolve, 100)) // wait a bit for UI to settle
  if(!cropper) return
  const canvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' })
  if(!canvas) return
  canvas.toBlob((blob: Blob | null) =>{
    if(!blob) return
    emit('cropped', blob)
    show.value = false
  }, 'image/jpeg', 0.92)
}

function cancel(){
  show.value = false
}
</script>

<style scoped>
.cropper-container {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.cropper-card {
  width: min(960px, 96vw);
  max-width: 96vw;
  height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
}

.cropper-card-section {
  padding: 16px;
  height: 100%;
  display: flex;
  min-height: 0;
}

.cropper-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.cropper-preview-panel {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cropper-image {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.cropper-controls {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.control-actions,
.confirm-actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-btn {
  flex: 1 1 160px;
}

.rotate-row {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.rotate-input {
  width: 120px;
  max-width: 100%;
}

@media (max-width: 767px) {
  .cropper-card {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    border-radius: 0;
  }

  .cropper-card-section {
    padding: 12px;
  }

  .cropper-layout {
    gap: 12px;
  }

  .control-btn {
    flex: 1 1 100%;
  }
}
</style>
