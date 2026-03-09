<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 360px; max-width: 900px;">
      <q-card-section>
        <div class="cropper-container">
          <div style="display:flex; gap:12px;">
            <div style="flex:1; min-width:280px;">
              <img ref="imgRef" :src="src ?? ''" alt="to-crop" style="max-width:100%; display:block;" />
            </div>
            <div style="width:240px; display:flex; flex-direction:column; gap:8px;">
              <q-btn size="sm" color="primary" label="Detect face" @click="detectFace" />
              <q-btn size="sm" color="primary" label="Reset" @click="resetCrop" />
              <q-separator />
              <div>
                <div>Zoom</div>
                <q-slider :model-value="zoom" :min="0.5" :max="3" :step="0.01" @update:model-value="onZoom"/>
              </div>
              <div>
                <div>Rotate</div>
                <q-slider :model-value="rotate" :min="-180" :max="180" :step="1" @update:model-value="onRotate"/>
                <div style="margin-top:6px; display:flex; gap:8px; align-items:center;">
                  <q-input dense type="number" style="width:120px;" :model-value="rotate" @update:model-value="onRotate" />
                  <q-btn dense flat label="0°" @click="onRotate(0)" />
                </div>
              </div>
              <q-btn color="positive" label="Confirm crop" @click="confirm" />
              <q-btn color="negative" label="Cancel" flat @click="cancel" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
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

function onZoom(v: number | null){
  if(v == null) return
  zoom.value = v
  if(!cropper) return
  try{ cropper.zoomTo(v) }catch{/* ignore */}
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
.cropper-container { display:block }
</style>
