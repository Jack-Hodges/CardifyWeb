import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
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

// Wrap the component with forwardRef so we can expose methods to the parent.
const Drawing = forwardRef((props, ref) => {
  // Refs for two canvases: one for drawing, one for images
  const drawingCanvasRef = useRef(null)
  const drawingContextRef = useRef(null)
  const imageCanvasRef = useRef(null)
  const imageContextRef = useRef(null)
  
  // Drawing state and other variables
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState('brush')
  const [brushSize, setBrushSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(10)
  const [brushColor, setBrushColor] = useState('#000000')
  const [showBrushSettings, setShowBrushSettings] = useState(false)
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
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      clientX,
      clientY
    }
  }

  // Initialize drawing canvas (runs only once)
  useEffect(() => {
    const canvas = drawingCanvasRef.current
    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `100dvh`
    // Prevent scrolling/pinch-zoom on mobile
    canvas.style.touchAction = 'none'
    const context = canvas.getContext('2d')
    context.scale(2, 2)
    context.lineCap = 'round'
    context.lineWidth = brushSize
    context.lineJoin = 'round'
    context.strokeStyle = brushColor
    drawingContextRef.current = context
    // Save initial (blank) state for undo
    const initialState = context.getImageData(0, 0, canvas.width, canvas.height)
    undoStack.current.push(initialState)
  }, [])

  useEffect(() => {
    if (mode === 'brush' && drawingContextRef.current) {
      drawingContextRef.current.lineWidth = brushSize
      drawingContextRef.current.strokeStyle = brushColor
    }
  }, [brushSize, brushColor, mode])

  useEffect(() => {
    if (mode === 'erase' && drawingContextRef.current) {
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
      setShowCursor(false)
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
  }

  const handleModeSwitch = (newMode) => {
    if (newMode !== 'select') {
      setSelectedImageId(null)
      setImageAction(null)
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
      drawingContextRef.current.clearRect(0, 0, canvas.width, canvas.height)
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

  useEffect(() => {
    const canvas = imageCanvasRef.current
    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `100dvh`
    canvas.style.touchAction = 'none'
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2)
    imageContextRef.current = ctx
    drawImages()
  }, [images, selectedImageId])

  const drawImages = () => {
    const canvas = imageCanvasRef.current
    const ctx = imageContextRef.current
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
  }

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
          const newImage = {
            id: Date.now(),
            img: highQualityImg,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
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
    <div style={{ margin: 0, padding: 0, touchAction: 'none' }}>
      <div style={{ position: 'relative', width: '100vw', height: '100dvh' }}>
        {/* Bottom toolbar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-6 items-center bg-white rounded-lg p-2 shadow-md">
          <button
            onClick={() => handleModeSwitch('brush')}
            className={`${mode === 'brush' ? 'bg-gray-100' : ''} hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100`}
          >
            <Brush size={30} color="#4f4f4f" />
          </button>
          {mode === 'brush' && (
            <div className="flex gap-6">
              <div
                className="w-10 h-10 rounded-full cursor-pointer"
                style={{ backgroundColor: brushColor, position: 'relative' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSketchPicker(true)
                }}
              >
                {showSketchPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      zIndex: 50,
                      bottom: 'calc(100% + 10px)'
                    }}
                  >
                    <SketchPicker
                      color={brushColor}
                      onChange={(color) => setBrushColor(color.hex)}
                    />
                  </div>
                )}
              </div>
              <div className="relative inline-block">
                <div
                  className="w-10 h-10 rounded-full border border-black flex items-center justify-center cursor-pointer"
                  onClick={() => setShowSizeInput((prev) => !prev)}
                >
                  <div
                    style={{
                      width: `${(brushSize / 50) * 100}%`,
                      height: `${(brushSize / 50) * 100}%`
                    }}
                    className="rounded-full bg-current"
                  />
                </div>
                {showSizeInput && (
                  <div className="absolute top-[-70px] left-[-30px]">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      style={{
                        transform: 'rotate(-90deg)',
                        width: '100px',
                        position: 'absolute'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => handleModeSwitch('erase')}
            className={`${mode === 'erase' ? 'bg-gray-100' : ''} hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100`}
          >
            <Eraser size={30} color="#4f4f4f" />
          </button>
          {mode === 'erase' && (
            <div className="relative inline-block">
              <div
                className="w-10 h-10 rounded-full border border-black flex items-center justify-center cursor-pointer"
                onClick={() => setShowEraserSettings((prev) => !prev)}
              >
                <div
                  style={{
                    width: `${(eraserSize / 50) * 100}%`,
                    height: `${(eraserSize / 50) * 100}%`
                  }}
                  className="rounded-full bg-current"
                />
              </div>
              {showEraserSettings && (
                <div className="absolute top-[-70px] left-[-30px]">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(parseInt(e.target.value))}
                    style={{
                      transform: 'rotate(-90deg)',
                      width: '100px',
                      position: 'absolute'
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => handleModeSwitch('select')}
            className={`${mode === 'select' ? 'bg-gray-100' : ''} hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100`}
          >
            <MousePointer size={30} color="#4f4f4f" />
          </button>
          <button
            onClick={handleUndo}
            className="hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100"
          >
            <RotateCcw size={30} color="#4f4f4f" />
          </button>
          <button
            onClick={handleRedo}
            className="hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100"
          >
            <RotateCw size={30} color="#4f4f4f" />
          </button>
          <button
            onClick={handleClear}
            className="hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100"
          >
            <Trash size={30} color="#4f4f4f" />
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100"
          >
            <ImageIcon size={30} color="#4f4f4f" />
          </button>
          <button
            onClick={handleDownload}
            className="hover:bg-gray-200 border-none cursor-pointer p-2 rounded-md transition duration-100"
          >
            <Download size={30} color="#4f4f4f" />
          </button>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas
            ref={imageCanvasRef}
            onClick={() => { 
              setShowSketchPicker(false)
              setShowSizeInput(false)
            }}
            onMouseDown={handleImageCanvasMouseDown}
            onMouseMove={handleImageCanvasMouseMove}
            onMouseUp={handleImageCanvasMouseUp}
            onTouchStart={handleImageCanvasMouseDown}
            onTouchMove={handleImageCanvasMouseMove}
            onTouchEnd={handleImageCanvasMouseUp}
            style={{
              border: '1px solid transparent',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: mode === 'select' ? 'auto' : 'none',
              zIndex: 1,
              touchAction: 'none'
            }}
          />
          <canvas
            ref={drawingCanvasRef}
            onClick={() => { 
              setShowSketchPicker(false)
              setShowSizeInput(false)
            }}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
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
              border: '1px solid #000',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              pointerEvents: mode === 'select' ? 'none' : 'auto',
              touchAction: 'none'
            }}
          />
        </div>
        {showCursor && (mode === 'brush' || mode === 'erase') && (
          <div
            style={{
              position: 'fixed',
              top: cursorPos.y - currentSize / 2,
              left: cursorPos.x - currentSize / 2,
              width: currentSize,
              height: currentSize,
              border: '1px solid gray',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 40
            }}
          />
        )}
      </div>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  )
});

export default Drawing;