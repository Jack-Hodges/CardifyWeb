import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Brush,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash,
  MousePointer,
  Image as ImageIcon,
  Download
} from 'lucide-react'
import { SketchPicker } from 'react-color'
import BackgroundButton from '../Elements/BackgroundButton'
import { useUser } from '../../UserContext'

// Wrap the component with forwardRef so we can expose methods to the parent.
const Drawing = forwardRef((props, ref) => {
  const { theme } = useUser()
  const { primaryColor, secondaryColor, tertiaryColor } = theme || {}
  const primaryBtn = theme
    ? `${primaryColor.bgClass} ${primaryColor.hoverClass}`
    : 'bg-blue-500 hover:bg-blue-400'
  const secondaryBtn = theme
    ? `${secondaryColor.bgClass} ${secondaryColor.hoverClass}`
    : 'bg-orange-500 hover:bg-orange-400'
  const tertiaryBtn = theme
    ? `${tertiaryColor.bgClass} ${tertiaryColor.hoverClass}`
    : 'bg-purple-500 hover:bg-purple-400'
  const idleBtn = 'bg-gray-500 hover:bg-gray-400'
  // Refs for two canvases: one for drawing, one for images
  const containerRef = useRef(null)
  const drawingCanvasRef = useRef(null)
  const drawingContextRef = useRef(null)
  const imageCanvasRef = useRef(null)
  const imageContextRef = useRef(null)
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  
  // Drawing state and other variables
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState('brush')
  const [brushSize, setBrushSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(10)
  const [brushColor, setBrushColor] = useState('#000000')
  const [, setShowBrushSettings] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)
  const [showSketchPicker, setShowSketchPicker] = useState(false)
  const [showSizeInput, setShowSizeInput] = useState(false)
  const [showEraserSettings, setShowEraserSettings] = useState(false)
  const [images, setImages] = useState([]) // each image: { id, img, x, y, width, height, rotation }
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [imageAction, setImageAction] = useState(null) // 'move' | 'resize' | 'rotate'
  const [initialMousePos, setInitialMousePos] = useState(null)
  const [initialImageProps, setInitialImageProps] = useState(null)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const brushSizeRef = useRef(brushSize)
  const brushColorRef = useRef(brushColor)
  const eraserSizeRef = useRef(eraserSize)
  const modeRef = useRef(mode)
  const drawImagesRef = useRef(() => {})

  useEffect(() => { brushSizeRef.current = brushSize }, [brushSize])
  useEffect(() => { brushColorRef.current = brushColor }, [brushColor])
  useEffect(() => { eraserSizeRef.current = eraserSize }, [eraserSize])
  useEffect(() => { modeRef.current = mode }, [mode])

  // Helper to extract pointer coordinates from both mouse and touch events
  const getEventPos = (e, canvas) => {
    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    const rect = canvas.getBoundingClientRect()
    // Context is scaled by devicePixelRatio, so use CSS-pixel offsets
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      clientX,
      clientY
    }
  }

  const applyStrokeStyle = (ctx) => {
    if (!ctx) return
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (modeRef.current === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = eraserSizeRef.current
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = brushSizeRef.current
      ctx.strokeStyle = brushColorRef.current
    }
  }

  const syncCanvasSize = useCallback((preserveDrawing = true) => {
    const container = containerRef.current
    const drawingCanvas = drawingCanvasRef.current
    const imageCanvas = imageCanvasRef.current
    if (!container || !drawingCanvas || !imageCanvas) return

    const width = Math.max(1, Math.floor(container.clientWidth))
    const height = Math.max(1, Math.floor(container.clientHeight))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const prev = sizeRef.current

    if (prev.width === width && prev.height === height && prev.dpr === dpr && drawingContextRef.current) {
      return
    }

    let savedDrawing = null
    if (preserveDrawing && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
      savedDrawing = document.createElement('canvas')
      savedDrawing.width = drawingCanvas.width
      savedDrawing.height = drawingCanvas.height
      savedDrawing.getContext('2d').drawImage(drawingCanvas, 0, 0)
    }

    const setup = (canvas) => {
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.style.touchAction = 'none'
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      return ctx
    }

    const drawingCtx = setup(drawingCanvas)
    const imageCtx = setup(imageCanvas)

    if (savedDrawing) {
      drawingCtx.setTransform(1, 0, 0, 1, 0, 0)
      drawingCtx.drawImage(savedDrawing, 0, 0, drawingCanvas.width, drawingCanvas.height)
      drawingCtx.scale(dpr, dpr)
    }

    applyStrokeStyle(drawingCtx)
    drawingContextRef.current = drawingCtx
    imageContextRef.current = imageCtx
    sizeRef.current = { width, height, dpr }

    if (!preserveDrawing || undoStack.current.length === 0) {
      const initialState = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
      undoStack.current = [initialState]
      redoStack.current = []
    }
  }, [])

  useEffect(() => {
    if (mode === 'brush' && drawingContextRef.current) {
      drawingContextRef.current.globalCompositeOperation = 'source-over'
      drawingContextRef.current.lineWidth = brushSize
      drawingContextRef.current.strokeStyle = brushColor
    }
  }, [brushSize, brushColor, mode])

  useEffect(() => {
    if (mode === 'erase' && drawingContextRef.current) {
      drawingContextRef.current.globalCompositeOperation = 'destination-out'
      drawingContextRef.current.lineWidth = eraserSize
    }
  }, [eraserSize, mode])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImageId) {
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== selectedImageId)
        )
        setSelectedImageId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImageId])

  // Size canvases to the visible container (not the full viewport)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const resize = () => {
      syncCanvasSize(true)
      drawImagesRef.current?.()
    }

    syncCanvasSize(false)
    drawImagesRef.current?.()

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    window.addEventListener('orientationchange', resize)

    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', resize)
    }
  }, [syncCanvasSize])

  // Drawing handlers (note: preventDefault() calls have been removed)
  const startDrawing = (e) => {
    if (mode === 'brush' || mode === 'erase') {
      e.preventDefault()
      setShowBrushSettings(false)
      setShowEraserSettings(false)
      setShowSizeInput(false)
      const pos = getEventPos(e, drawingCanvasRef.current)
      drawingContextRef.current.beginPath()
      drawingContextRef.current.moveTo(pos.offsetX, pos.offsetY)
      setIsDrawing(true)
      setShowCursor(true)
      setCursorPos({ x: pos.clientX, y: pos.clientY })
    }
  }

  const finishDrawing = (e) => {
    if (mode === 'brush' || mode === 'erase') {
      e && e.preventDefault()
      drawingContextRef.current.closePath()
      setIsDrawing(false)
      const canvas = drawingCanvasRef.current
      const imageData = drawingContextRef.current.getImageData(0, 0, canvas.width, canvas.height)
      undoStack.current.push(imageData)
      redoStack.current = []
    }
  }

  const draw = (e) => {
    if (!(mode === 'brush' || mode === 'erase')) return
    if (!isDrawing) return
    e.preventDefault()
    const pos = getEventPos(e, drawingCanvasRef.current)
    drawingContextRef.current.lineTo(pos.offsetX, pos.offsetY)
    drawingContextRef.current.stroke()
    setCursorPos({ x: pos.clientX, y: pos.clientY })
  }

  const handleMouseMove = (e) => {
    const pos = getEventPos(e, drawingCanvasRef.current)
    setCursorPos({ x: pos.clientX, y: pos.clientY })
    if (mode === 'brush' || mode === 'erase') {
      setShowCursor(true)
    }
  }

  const handleCursorEnter = (e) => {
    if (mode !== 'brush' && mode !== 'erase') return
    const pos = getEventPos(e, drawingCanvasRef.current)
    setCursorPos({ x: pos.clientX, y: pos.clientY })
    setShowCursor(true)
  }

  const handleCursorLeave = () => {
    setShowCursor(false)
  }

  const handleModeSwitch = (newMode) => {
    if (newMode !== 'select') {
      setSelectedImageId(null)
      setImageAction(null)
    } else {
      setShowCursor(false)
    }
    setMode(newMode)
    
    if (newMode === 'brush') {
      drawingContextRef.current.globalCompositeOperation = 'source-over'
      drawingContextRef.current.lineWidth = brushSize
      drawingContextRef.current.strokeStyle = brushColor
      setShowEraserSettings(false)
    } else if (newMode === 'erase') {
      drawingContextRef.current.globalCompositeOperation = 'destination-out'
      drawingContextRef.current.lineWidth = eraserSize
      setShowEraserSettings(false)
      setShowBrushSettings(false)
    } else if (newMode === 'select') {
      setShowBrushSettings(false)
      setShowEraserSettings(false)
    }
  }

  const handleUndo = () => {
    if (undoStack.current.length > 1) {
      const currentState = undoStack.current.pop()
      redoStack.current.push(currentState)
      const previousState = undoStack.current[undoStack.current.length - 1]
      drawingContextRef.current.putImageData(previousState, 0, 0)
    }
  }

  const handleRedo = () => {
    if (redoStack.current.length > 0) {
      const nextState = redoStack.current.pop()
      undoStack.current.push(nextState)
      drawingContextRef.current.putImageData(nextState, 0, 0)
    }
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas and remove all images?')) {
      const canvas = drawingCanvasRef.current
      const { width, height } = sizeRef.current
      drawingContextRef.current.clearRect(0, 0, width, height)
      const clearedState = drawingContextRef.current.getImageData(0, 0, canvas.width, canvas.height)
      undoStack.current.push(clearedState)
      redoStack.current = []
      setImages([])
      setSelectedImageId(null)
    }
  }

  const handleDownload = () => {
    const width = drawingCanvasRef.current.width
    const height = drawingCanvasRef.current.height
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = width
    offscreenCanvas.height = height
    const ctx = offscreenCanvas.getContext('2d')
    ctx.drawImage(imageCanvasRef.current, 0, 0)
    ctx.drawImage(drawingCanvasRef.current, 0, 0)
    const dataURL = offscreenCanvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataURL
    a.download = 'canvas.png'
    a.click()
  }

  const drawImages = useCallback(() => {
    const canvas = imageCanvasRef.current
    const ctx = imageContextRef.current
    if (!ctx || !canvas) return
    const { width, height } = sizeRef.current
    ctx.clearRect(0, 0, width || canvas.width, height || canvas.height)
    images.forEach((image) => {
      ctx.save()
      ctx.translate(image.x, image.y)
      ctx.rotate(image.rotation)
      ctx.drawImage(image.img, -image.width / 2, -image.height / 2, image.width, image.height)
      if (image.id === selectedImageId) {
        ctx.strokeStyle = 'blue'
        ctx.lineWidth = 2
        ctx.strokeRect(-image.width / 2, -image.height / 2, image.width, image.height)
        const resizeHandleSize = 20
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'blue'
        ctx.fillRect(image.width / 2 - resizeHandleSize / 2, image.height / 2 - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize)
        ctx.strokeRect(image.width / 2 - resizeHandleSize / 2, image.height / 2 - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize)
        const rotationHandleSize = 10
        const rotationHandleY = -image.height / 2 - 20
        ctx.beginPath()
        ctx.arc(0, rotationHandleY, rotationHandleSize / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()
    })
  }, [images, selectedImageId])

  useEffect(() => {
    drawImages()
  }, [drawImages])

  useEffect(() => {
    drawImagesRef.current = drawImages
  }, [drawImages])

  const fileInputRef = useRef(null)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        offCanvas.width = img.width * scale;
        offCanvas.height = img.height * scale;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
        // Use the original file's MIME type and quality 1 for maximum quality.
        const originalDataUrl = offCanvas.toDataURL(file.type, 1);
        const highQualityImg = new Image();
        highQualityImg.onload = () => {
          const { width, height } = sizeRef.current
          const newImage = {
            id: Date.now(),
            img: highQualityImg,
            x: (width || 400) / 2,
            y: (height || 400) / 2,
            width: offCanvas.width,
            height: offCanvas.height,
            rotation: 0
          };
          setImages((prev) => [...prev, newImage]);
          setMode('select');
          setSelectedImageId(newImage.id);
        };
        highQualityImg.src = originalDataUrl;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageCanvasMouseDown = (e) => {
    if (mode !== 'select') return
    e.preventDefault()
    const pos = getEventPos(e, imageCanvasRef.current)
    const x = pos.offsetX
    const y = pos.offsetY
    let found = false
    for (let i = images.length - 1; i >= 0; i--) {
      const image = images[i]
      const dx = x - image.x
      const dy = y - image.y
      const cos = Math.cos(-image.rotation)
      const sin = Math.sin(-image.rotation)
      const localX = dx * cos - dy * sin
      const localY = dx * sin + dy * cos
      const resizeHandleSize = 20
      if (
        localX >= image.width / 2 - resizeHandleSize / 2 &&
        localX <= image.width / 2 + resizeHandleSize / 2 &&
        localY >= image.height / 2 - resizeHandleSize / 2 &&
        localY <= image.height / 2 + resizeHandleSize / 2
      ) {
        found = true
        setSelectedImageId(image.id)
        setImageAction('resize')
        setInitialMousePos({ x, y })
        setInitialImageProps({ ...image })
        break
      } else if (Math.hypot(localX, localY + image.height / 2 + 20) < 10) {
        found = true
        setSelectedImageId(image.id)
        setImageAction('rotate')
        setInitialMousePos({ x, y })
        setInitialImageProps({ ...image })
        break
      } else if (Math.abs(localX) <= image.width / 2 && Math.abs(localY) <= image.height / 2) {
        found = true
        setSelectedImageId(image.id)
        setImageAction('move')
        setInitialMousePos({ x, y })
        setInitialImageProps({ ...image })
        break
      }
    }
    if (!found) {
      setSelectedImageId(null)
    }
  }

  const handleImageCanvasMouseMove = (e) => {
    if (mode !== 'select' || !imageAction || !selectedImageId) return
    e.preventDefault()
    const pos = getEventPos(e, imageCanvasRef.current)
    const x = pos.offsetX
    const y = pos.offsetY
    const dx = x - initialMousePos.x
    const dy = y - initialMousePos.y
    setImages((prevImages) =>
      prevImages.map((img) => {
        if (img.id === selectedImageId) {
          if (imageAction === 'move') {
            return { ...img, x: initialImageProps.x + dx, y: initialImageProps.y + dy }
          } else if (imageAction === 'resize') {
            const newWidth = Math.max(10, initialImageProps.width + dx)
            const newHeight = Math.max(10, initialImageProps.height + dy)
            return { ...img, width: newWidth, height: newHeight }
          } else if (imageAction === 'rotate') {
            const centerX = initialImageProps.x
            const centerY = initialImageProps.y
            const angleInitial = Math.atan2(initialMousePos.y - centerY, initialMousePos.x - centerX)
            const angleCurrent = Math.atan2(y - centerY, x - centerX)
            const deltaAngle = angleCurrent - angleInitial
            return { ...img, rotation: initialImageProps.rotation + deltaAngle }
          }
        }
        return img
      })
    )
  }

  const handleImageCanvasMouseUp = (e) => {
    if (mode !== 'select') return
    e && e.preventDefault()
    setImageAction(null)
  }

  const currentSize = mode === 'brush' ? brushSize : eraserSize

  // Expose exportDrawing method to parent via ref
  useImperativeHandle(ref, () => ({
    exportDrawing: () => {
      const offscreenCanvas = document.createElement('canvas')
      offscreenCanvas.width = drawingCanvasRef.current.width
      offscreenCanvas.height = drawingCanvasRef.current.height
      const ctx = offscreenCanvas.getContext('2d')
      // Draw the image canvas first, then the drawing canvas on top
      ctx.drawImage(imageCanvasRef.current, 0, 0)
      ctx.drawImage(drawingCanvasRef.current, 0, 0)
      const dataURL = offscreenCanvas.toDataURL('image/png')
      // Convert the dataURL to a Blob, then create and return a File
      const byteString = atob(dataURL.split(',')[1])
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      return new File([blob], 'drawing.png', { type: mimeString })
    }
  }))

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white" style={{ margin: 0, padding: 0, touchAction: 'none' }}>
      <div className="absolute inset-0">
        <canvas
          ref={imageCanvasRef}
          onClick={() => { 
            setShowSketchPicker(false)
            setShowSizeInput(false)
            setShowEraserSettings(false)
          }}
          onMouseDown={handleImageCanvasMouseDown}
          onMouseMove={handleImageCanvasMouseMove}
          onMouseUp={handleImageCanvasMouseUp}
          onTouchStart={handleImageCanvasMouseDown}
          onTouchMove={handleImageCanvasMouseMove}
          onTouchEnd={handleImageCanvasMouseUp}
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: mode === 'select' ? 'auto' : 'none',
            zIndex: 1,
            touchAction: 'none',
            cursor: mode === 'select' ? 'default' : 'none'
          }}
        />
        <canvas
          ref={drawingCanvasRef}
          onClick={() => { 
            setShowSketchPicker(false)
            setShowSizeInput(false)
            setShowEraserSettings(false)
          }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseEnter={handleCursorEnter}
          onMouseLeave={handleCursorLeave}
          onMouseMove={(e) => {
            draw(e)
            handleMouseMove(e)
          }}
          onTouchStart={startDrawing}
          onTouchMove={(e) => {
            draw(e)
            handleMouseMove(e)
          }}
          onTouchEnd={finishDrawing}
          style={{
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            pointerEvents: mode === 'select' ? 'none' : 'auto',
            touchAction: 'none',
            cursor: mode === 'brush' || mode === 'erase' ? 'none' : 'default'
          }}
        />
      </div>

      {/* Free-floating tools — along the bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center justify-center gap-2">
        <BackgroundButton
          image={<Brush size={20} strokeWidth={2.5} />}
          bgColor={mode === 'brush' ? primaryBtn : idleBtn}
          onClick={() => handleModeSwitch('brush')}
        />
        {mode === 'brush' && (
          <>
            <div className="relative">
              <button
                type="button"
                title="Brush color"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full background-shadow-new background-hover"
                style={{ backgroundColor: brushColor }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSketchPicker((v) => !v)
                  setShowSizeInput(false)
                }}
              />
              {showSketchPicker && (
                <div
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 rounded-xl overflow-hidden background-shadow-new bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SketchPicker
                    color={brushColor}
                    onChange={(color) => setBrushColor(color.hex)}
                  />
                </div>
              )}
            </div>
            <div className="relative">
              <BackgroundButton
                image={
                  <span
                    className="rounded-full bg-white"
                    style={{
                      width: `${Math.max(6, (brushSize / 50) * 22)}px`,
                      height: `${Math.max(6, (brushSize / 50) * 22)}px`
                    }}
                  />
                }
                bgColor={secondaryBtn}
                onClick={() => {
                  setShowSizeInput((prev) => !prev)
                  setShowSketchPicker(false)
                }}
              />
              {showSizeInput && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl px-3 py-2 background-shadow-new">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                    className="w-28"
                  />
                </div>
              )}
            </div>
          </>
        )}

        <BackgroundButton
          image={<Eraser size={20} strokeWidth={2.5} />}
          bgColor={mode === 'erase' ? primaryBtn : idleBtn}
          onClick={() => handleModeSwitch('erase')}
        />
        {mode === 'erase' && (
          <div className="relative">
            <BackgroundButton
              image={
                <span
                  className="rounded-full bg-white"
                  style={{
                    width: `${Math.max(6, (eraserSize / 50) * 22)}px`,
                    height: `${Math.max(6, (eraserSize / 50) * 22)}px`
                  }}
                />
              }
              bgColor={secondaryBtn}
              onClick={() => setShowEraserSettings((prev) => !prev)}
            />
            {showEraserSettings && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl px-3 py-2 background-shadow-new">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(parseInt(e.target.value, 10))}
                  className="w-28"
                />
              </div>
            )}
          </div>
        )}

        <BackgroundButton
          image={<MousePointer size={20} strokeWidth={2.5} />}
          bgColor={mode === 'select' ? primaryBtn : idleBtn}
          onClick={() => handleModeSwitch('select')}
        />
        <BackgroundButton
          image={<RotateCcw size={20} strokeWidth={2.5} />}
          bgColor={idleBtn}
          onClick={handleUndo}
        />
        <BackgroundButton
          image={<RotateCw size={20} strokeWidth={2.5} />}
          bgColor={idleBtn}
          onClick={handleRedo}
        />
        <BackgroundButton
          image={<Trash size={20} strokeWidth={2.5} />}
          bgColor="bg-red-500 hover:bg-red-400"
          onClick={handleClear}
        />
        <BackgroundButton
          image={<ImageIcon size={20} strokeWidth={2.5} />}
          bgColor={tertiaryBtn}
          onClick={() => fileInputRef.current.click()}
        />
        <BackgroundButton
          image={<Download size={20} strokeWidth={2.5} />}
          bgColor={secondaryBtn}
          onClick={handleDownload}
        />
      </div>

      {showCursor &&
        (mode === 'brush' || mode === 'erase') &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: cursorPos.y,
              left: cursorPos.x,
              width: currentSize,
              height: currentSize,
              transform: 'translate(-50%, -50%)',
              border: mode === 'brush' ? `2px solid ${brushColor}` : '2px solid rgba(3,15,64,0.55)',
              borderRadius: '50%',
              backgroundColor: mode === 'brush' ? `${brushColor}22` : 'rgba(3,15,64,0.08)',
              pointerEvents: 'none',
              zIndex: 200,
              boxSizing: 'border-box'
            }}
          />,
          document.body
        )}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  )
});

export default Drawing;