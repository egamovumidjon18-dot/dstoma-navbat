import React, { useRef, useEffect, useState } from 'react';

import imgFront from '../../assets/images/dental_front_1781343024210.jpg';
import imgLeft from '../../assets/images/dental_left_1781343044157.jpg';
import imgRight from '../../assets/images/dental_right_1781343065448.jpg';
import imgTop from '../../assets/images/dental_top_1781343094894.jpg';
import imgBottom from '../../assets/images/dental_bottom_1781343119565.jpg';

const viewImages = {
  front: imgFront,
  left: imgLeft,
  right: imgRight,
  top: imgTop,
  bottom: imgBottom
};

// Symmetrical high-fidelity coordinates mapping each dental index to its precise anatomical counterpart in the top/bottom occlusal photographs
const occlusalCoords = [
  { x: 328, y: 435 }, // idx 0   (FDI 18 - left-most upper molar)
  { x: 320, y: 378 }, // idx 1   (FDI 17)
  { x: 322, y: 315 }, // idx 2   (FDI 16)
  { x: 335, y: 255 }, // idx 3   (FDI 15)
  { x: 358, y: 205 }, // idx 4   (FDI 14)
  { x: 390, y: 162 }, // idx 5   (FDI 13)
  { x: 428, y: 135 }, // idx 6   (FDI 12)
  { x: 475, y: 118 }, // idx 7   (FDI 11) - Upper Central Incisor
  { x: 525, y: 118 }, // idx 8   (FDI 21) - Upper Central Incisor
  { x: 572, y: 135 }, // idx 9   (FDI 22)
  { x: 610, y: 162 }, // idx 10  (FDI 23)
  { x: 642, y: 205 }, // idx 11  (FDI 24)
  { x: 665, y: 255 }, // idx 12  (FDI 25)
  { x: 678, y: 315 }, // idx 13  (FDI 26)
  { x: 680, y: 378 }, // idx 14  (FDI 27)
  { x: 672, y: 435 }  // idx 15  (FDI 28 - right-most upper molar)
];


interface SceneProps {
  selectedToothIndex: number;
  setSelectedToothIndex: (idx: number) => void;
  renderMode: 'realistic' | 'ai-diagnostic' | 'x-ray';
  showRoots: boolean;
  showBone: boolean;
  crossSection: boolean;
  autoRotate: boolean;
  zoomLevel: number;
  brightness: number;
  jawView: 'both' | 'upper' | 'lower';
  getToothMetrics: (idx: number) => any;
  getAnatomicalName: (idx: number) => string;
  getToothDisplayNumber?: (idx: number, system: 'fdi' | 'universal') => number | string;
  dentalSystem?: 'fdi' | 'universal';
  localLang?: 'uz' | 'ru' | 'en';
  currentView?: 'front' | 'left' | 'right' | 'top' | 'bottom';
  onViewChange?: (view: 'front' | 'left' | 'right' | 'top' | 'bottom') => void;
}

export function Scene({
  selectedToothIndex,
  setSelectedToothIndex,
  renderMode,
  showRoots,
  showBone,
  crossSection,
  autoRotate,
  zoomLevel,
  brightness,
  jawView,
  getToothMetrics,
  getAnatomicalName,
  getToothDisplayNumber,
  dentalSystem,
  localLang = 'uz',
  currentView,
  onViewChange
}: SceneProps) {
  // Local state for active camera perspective preset
  const [localView, setLocalView] = useState<'front' | 'left' | 'right' | 'top' | 'bottom'>('front');
  const view = currentView || localView;
  const setView = (newView: 'front' | 'left' | 'right' | 'top' | 'bottom') => {
    setLocalView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };
  const [scanActive, setScanActive] = useState<boolean>(false);
  const [rotationOffset, setRotationOffset] = useState<number>(0);

  // Swipe and Drag gesture trackers to easily control the jaw model physically
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(true);
  const [dragFeedBack, setDragFeedBack] = useState<string>("");

  // Swipe gesture triggers
  const handlePointerDown = (clientX: number, clientY: number) => {
    dragStartRef.current = { x: clientX, y: clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    
    // Set dragging mode trigger if user moved past threshold
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    dragStartRef.current = null;

    if (!isDraggingRef.current) return;

    const swipeThreshold = 55; // minimum px movement to register swipe
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swiping: left and right views are removed by user request. Returning to front view if in top/bottom.
      if (Math.abs(dx) > swipeThreshold) {
        if (view === 'bottom' || view === 'top') {
          setView('front');
          triggerFeedback(localLang === 'uz' ? "Oldindan ko'rinish" : localLang === 'ru' ? "Вид спереди" : "Front View");
        }
      }
    } else {
      // Vertical swiping: Navigate TOP <-> BOTH <-> BOTTOM
      if (dy > swipeThreshold) {
        // Drag downward -> show lower jaw occlusal
        if (view !== 'bottom') {
          setView('bottom');
          triggerFeedback(localLang === 'uz' ? "Tishlash yuzasi: Pastki jag'" : localLang === 'ru' ? "Окклюзия: Нижняя челюсть" : "Mandibular Occlusal");
        }
      } else if (dy < -swipeThreshold) {
        // Drag upward -> show upper jaw occlusal
        if (view !== 'top') {
          setView('top');
          triggerFeedback(localLang === 'uz' ? "Tishlash yuzasi: Tepa jag'" : localLang === 'ru' ? "Окклюзия: Верхняя челюсть" : "Maxillary Occlusal");
        }
      }
    }
  };

  const triggerFeedback = (msg: string) => {
    setDragFeedBack(msg);
    const timer = setTimeout(() => setDragFeedBack(""), 1205);
    return () => clearTimeout(timer);
  };

  const getHelpText = () => {
    if (localLang === 'uz') {
      return {
        drag: "Surgich: chapga/o'ngga tortib burish • tepaga/pastga tortib tishlash yorlig'ini ochish.",
        click: "Tanlash uchun tish ustiga bosing",
        feedback: "Burchak burildi",
        compass: "KOMPAS"
      };
    } else if (localLang === 'ru') {
      return {
        drag: "Свайп: влево/вправо для вращения челюсти • вверх/вниз для смены челюсти.",
        click: "Нажмите на зуб для фокусировки",
        feedback: "Камера повернута",
        compass: "КОМПАС"
      };
    } else {
      return {
        drag: "Swipe: drag left/right to rotate jaw • drag up/down for bite views.",
        click: "Click any tooth to focus on it",
        feedback: "Perspective switched",
        compass: "COMPASS"
      };
    }
  };

  // Floating oscillation animation is handled via high-performance GPU-accelerated CSS keyframes!

  // Seamlessly cycle views on timer if autoRotate is true to simulate 3D inspection of high-res photos
  useEffect(() => {
    if (!autoRotate) return;
    const viewsList: ('front' | 'top' | 'bottom')[] = ['front', 'top', 'bottom'];
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % viewsList.length;
      setView(viewsList[currentIdx]);
    }, 4500); // cycle every 4.5 seconds for perfect inspect timing
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Hook into globally exposed window callbacks triggered from parent buttons
  useEffect(() => {
    (window as any).__dentalSetViewPreset = (preset: 'front' | 'top' | 'bottom' | 'rotate') => {
      if (preset === 'rotate') {
        // Handled in parent autoRotate state, which changes our autoRotate prop.
      } else {
        setView(preset);
      }
    };

    (window as any).__dentalResetCamera = () => {
      setView('front');
    };

    (window as any).__dentalRefocus = () => {
      setScanActive(true);
      const timer = setTimeout(() => setScanActive(false), 1600);
      return () => clearTimeout(timer);
    };

    return () => {
      delete (window as any).__dentalSetViewPreset;
      delete (window as any).__dentalResetCamera;
      delete (window as any).__dentalRefocus;
    };
  }, []);

  // Determine tooth anatomy category based on standard dental naming conventions
  const getToothAnatomyType = (idx: number): 'molar' | 'premolar' | 'canine' | 'incisor' => {
    const anatomicalName = getAnatomicalName(idx).toLowerCase();
    if (
      anatomicalName.includes('molyar') ||
      anatomicalName.includes('molar') ||
      anatomicalName.includes('wisdom') ||
      anatomicalName.includes('aql')
    ) {
      return 'molar';
    } else if (
      anatomicalName.includes('premolyar') ||
      anatomicalName.includes('premolar')
    ) {
      return 'premolar';
    } else if (
      anatomicalName.includes('qoziq') ||
      anatomicalName.includes('canine')
    ) {
      return 'canine';
    }
    return 'incisor';
  };

  // Helper function to return SVG path strings for various crown structures in different views
  const getToothCrownPath = (
    type: 'molar' | 'premolar' | 'canine' | 'incisor',
    isUpper: boolean,
    isOcclusal: boolean = false
  ) => {
    if (isOcclusal) {
      // Occlusal views (TOP/BOTTOM horseshoe chewing faces)
      if (type === 'molar') {
        // Quad-cuspid rectangular chewing surface
        return "M -14,-11 C -14,-16 14,-16 14,-11 C 17,-4 17,4 14,11 C 14,16 -14,16 -14,11 C -17,4 -17,-4 -14,-11 Z";
      } else if (type === 'premolar') {
        // Rounded oval chewing surface
        return "M -11,-9 C -11,-13 11,-13 11,-9 C 13,-3 13,3 11,9 C 11,13 -11,13 -11,9 C -13,3 -13,-3 -11,-9 Z";
      } else if (type === 'canine') {
        // Diamond spit-shaped cusp cutting face
        return "M -9,-5 C -9,-9 9,-9 9,-5 C 11,-1 11,1 9,5 C 9,9 -9,9 -9,5 C -11,1 -11,-1 -9,-5 Z";
      } else {
        // Incisor narrow slicing blade face
        return "M -12,-3.5 C -12,-6.5 12,-6.5 12,-3.5 C 13,-1 13,1 12,3.5 C 12,6.5 -12,6.5 -12,3.5 C -13,1 -13,-1 -12,-3.5 Z";
      }
    }

    if (isUpper) {
      // Upper pointing down (neck is at y=0, crown grows toward positive y)
      if (type === 'incisor') {
        // Smooth flat central/lateral spade
        return "M -12,0 C -11,6 -14,24 -14,31 C -14,34.5 -8,36 0,36 C 8,36 14,34.5 14,31 C 14,24 11,6 12,0 Z";
      } else if (type === 'canine') {
        // Sharp cusp canine
        return "M -11.5,0 C -10.5,10 -12.5,24 -10,31 C -9,33 -4,37.5 0,37.5 C 4,37.5 9,33 10,31 C 12.5,24 10.5,10 11.5,0 Z";
      } else if (type === 'premolar') {
        // Oval bicuspid crown
        return "M -13,0 C -12,6 -14,21 -14,27 C -14,30 -9,32 -4,31 C -2,30.5 2,30.5 4,31 C 9,32 14,30 14,27 C 14,21 12,6 13,0 Z";
      } else {
        // Wide robust molar crown
        return "M -18.5,0 C -16.5,7 -18.5,22 -18.5,27.5 C -18.5,31.5 -11.5,33.5 -8.5,31.5 C -4.5,29.5 4.5,29.5 8.5,31.5 C 11.5,33.5 18.5,31.5 18.5,27.5 C 18.5,22 16.5,7 18.5,0 Z";
      }
    } else {
      // Lower pointing up (neck is at y=0, crown grows toward negative y)
      if (type === 'incisor') {
        return "M -10,0 C -9.5,-6 -11.5,-23 -11.5,-29.5 C -11.5,-32.5 -7,-34.5 0,-34.5 C 7,-34.5 11.5,-32.5 11.5,-29.5 C 11.5,-23 9.5,-6 10,0 Z";
      } else if (type === 'canine') {
        return "M -10,0 C -9.5,-9 -11.5,-23 -9.5,-29.5 C -8.5,-31.5 -4,-35.5 0,-35.5 C 4,-35.5 8.5,-31.5 9.5,-29.5 C 11.5,-23 9.5,-9 10,0 Z";
      } else if (type === 'premolar') {
        return "M -12.5,0 C -11.5,-6 -13.5,-20 -13.5,-26 C -13.5,-29 -8.5,-31 -4,-30 C -2,-29.5 2,-29.5 4,-30 C 8.5,-31 13.5,-29 13.5,-26 C 13.5,-20 11.5,-6 12.5,0 Z";
      } else {
        return "M -17.5,0 C -15.5,-6.5 -17.5,-21 -17.5,-26 C -17.5,-30 -11,-31.5 -8,-30 C -4.5,-28 4.5,-28 8,-30 C 11,-31.5 17.5,-30 17.5,-26 C 17.5,-21 15.5,-6.5 17.5,0 Z";
      }
    }
  };

  // Shiny 3D gloss specular highlights overlays
  const getToothHighlightPath = (
    type: 'molar' | 'premolar' | 'canine' | 'incisor',
    isUpper: boolean,
    isOcclusal: boolean = false
  ) => {
    if (isOcclusal) {
      if (type === 'molar') {
        return "M -11,-10 C -5,-13 5,-13 11,-10";
      }
      return "M -7,-7 Q 0,-10 7,-7";
    }

    if (isUpper) {
      // White glossy crescent along the upper-left cusp shoulder
      if (type === 'molar') {
        return "M -14.5,4 C -13.5,8 -14.5,18 -14.5,22 C -14.5,25 -9.5,26.5 -6.5,24.5";
      } else if (type === 'premolar') {
        return "M -10.5,3 C -9.5,7 -11.5,16 -11.5,20 C -11.5,22 -8.5,23.5 -5,22.5";
      } else if (type === 'canine') {
        return "M -8.5,3 C -7.5,10 -9.5,18 -7.5,22";
      } else {
        return "M -9,3 C -8,8 -10.5,18 -10.5,23 C -10.5,25.5 -6,26.5 0,26.5";
      }
    } else {
      // Lower glossy highlight curving along lower-left cusp shoulder
      if (type === 'molar') {
        return "M -13,-4 C -12,-7 -13,-17 -13,-20 C -13,-23 -8,-24 -5,-22.5";
      } else if (type === 'premolar') {
        return "M -9.5,-3 C -8.5,-6 -10.5,-15 -10.5,-19 C -10.5,-21 -6.5,-22.5 -3,-21.5";
      } else if (type === 'canine') {
        return "M -7,-3 C -6.5,-9 -8.5,-17 -7,-21";
      } else {
        return "M -7.5,-3 C -7,-6 -8.5,-16 -8.5,-21 C -8.5,-23 -5,-24 0,-24";
      }
    }
  };

  // Helper function to return SVG paths for root structures
  const getToothRootPaths = (type: 'molar' | 'premolar' | 'canine' | 'incisor', isUpper: boolean) => {
    if (isUpper) {
      if (type === 'molar') {
        // Robust dual or triple split molar roots pointing upward
        return [
          "M -12.5,0 C -13,-10 -15.5,-26 -17.5,-29 C -14.5,-29 -10.5,-10 -9.5,0 Z", // Mesial
          "M 9.5,0 C 10.5,-10 14.5,-29 17.5,-29 C 15.5,-26 13,-10 12.5,0 Z",     // Distal
          "M -3,0 C -2,-12 -0.5,-24 -0.5,-27 C 0.5,-24 2,-12 3,0 Z"              // Lingual
        ];
      } else if (type === 'premolar') {
        // Bi-fanged premolar roots
        return [
          "M -8,0 C -8.5,-9 -11,-24 -12,-26 C -9.5,-25 -6,-10 -5,0 Z",
          "M 5,0 C 6,-10 9.5,-25 12,-26 C 11,-24 8.5,-9 8,0 Z"
        ];
      } else {
        // Robust single root tapered upward for incisors & canines
        return [
          "M -7,0 C -7.5,-12 -8.5,-31 -10,-35 C -6.5,-32 -2.5, -34 0,-37 C 2.5,-34 6.5,-32 10,-35 C 8.5,-31 7.5,-12 7,0 Z"
        ];
      }
    } else {
      // Lower roots pointing downward
      if (type === 'molar') {
        return [
          "M -12,0 C -12.5,10 -15,26 -17,29 C -14,29 -10,10 -9,0 Z",
          "M 9,0 C 10,10 14,29 17,29 C 15,26 12.5,10 12,0 Z"
        ];
      } else if (type === 'premolar') {
        return [
          "M -7,0 C -7.5,8 -9.5,21 -10.5,23 C -8.5,22 -5.5,9 -4.5,0 Z",
          "M 4.5,0 C 5.5,9 8.5,22 10.5,23 C 9.5,21 7.5,8 7,0 Z"
        ];
      } else {
        return [
          "M -6,0 C -6.5,12 -7.5,31 -9,35 C -5.5,32 -2.5,34 0,37 C 2.5,34 5.5,32 9,35 C 7.5,31 6.5,12 6,0 Z"
        ];
      }
    }
  };

  // Scalloped premium custom relative gum path slice for each tooth (Gives that perfect organic wrapping look!)
  const getToothIndividualGumPath = (type: 'molar' | 'premolar' | 'canine' | 'incisor', isUpper: boolean) => {
    // Width offset matches crown sizing
    const w = type === 'molar' ? 22 : type === 'premolar' ? 17 : type === 'canine' ? 14 : 14.5;
    if (isUpper) {
      // Gum line wrapping around upper neck, scalloping upwards
      return `M -${w},2.5 C -${w},-5 -8,-8 0,-8 C 8,-8 ${w},-5 ${w},2.5 L ${w},-25 L -${w},-25 Z`;
    } else {
      // Gum line wrapping lower neck, scalloping downwards
      return `M -${w},-2.5 C -${w},5 -8,8 0,8 C 8,8 ${w},5 ${w},-2.5 L ${w},25 L -${w},25 Z`;
    }
  };

  // Render organic molar grooves (Fissures)
  const renderFissures = (type: 'molar' | 'premolar', isUpper: boolean, isOcclusal: boolean = false) => {
    if (isOcclusal) {
      if (type === 'molar') {
        return (
          // Comprehensive crown anatomy grooves
          <g opacity="0.6">
            <path d="M -9,-3 Q 0,0 9,-3" stroke="#2a1e12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M -4,-8 L -4,6" stroke="#2a1e12" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M 4,-8 L 4,6" stroke="#2a1e12" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M -10,4 Q 0,-1 10,4" stroke="#2a1e12" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          </g>
        );
      }
      return (
        <path d="M -6,0 L 6,0" stroke="#2a1e12" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5" />
      );
    }

    return (
      <path 
        d={isUpper 
          ? (type === 'molar' ? "M -9,12 Q 0,16 9,12 M 0,3 L 0,22" : "M -5,12 Q 0,14 5,12")
          : (type === 'molar' ? "M -9,-12 Q 0,-16 9,-12 M 0,-3 L 0,-22" : "M -5,-12 Q 0,-14 5,-12")
        } 
        stroke="rgba(80, 52, 28, 0.44)" 
        strokeWidth="1.1" 
        fill="none" 
        strokeLinecap="round" 
      />
    );
  };

  // Generative layout calculations for all 5 views based on anatomical metrics
  const getToothDrawProps = (idx: number): {
    x: number;
    y: number;
    scale: number;
    isUpper: boolean;
    type: 'molar' | 'premolar' | 'canine' | 'incisor';
  } => {
    const isUpper = idx < 16;
    const type = getToothAnatomyType(idx);

    // Apply autoRotate gentle panning drift via GPU-accelerated CSS animations instead of state-updates!
    const panX = 0;
    const panY = 0;

    // View: FRONT (Extremely high fidelity arrangement with interlocking contact points)
    if (view === 'front') {
      if (isUpper) {
        // Smooth horizontal curve of 16 teeth
        const t = -1 + (idx / 7.5); // ranges -1 to 1
        const relativeX = Math.sin(t * Math.PI / 2.3);
        const x = 500 + relativeX * 338 + panX;
        const smileCurve = Math.cos(t * Math.PI / 2) * 18;
        const y = 224 - smileCurve + panY;
        // Molars are wider, incisors are taller
        const scale = type === 'molar' ? 1.05 : type === 'canine' ? 1.05 : type === 'incisor' ? 1.15 : 1.05;
        return { x, y, scale, isUpper, type };
      } else {
        // Lower arches (indices 16 to 31, mapped 48 to 38)
        const posFactor = idx - 16;
        const t = -1 + (posFactor / 7.5);
        const relativeX = Math.sin(t * Math.PI / 2.3);
        const x = 500 + relativeX * 334 + panX;
        const smileCurve = Math.cos(t * Math.PI / 2) * 13;
        const y = 278 + smileCurve + panY;
        const scale = type === 'molar' ? 1.02 : type === 'canine' ? 1.02 : type === 'incisor' ? 0.98 : 1.02;
        return { x, y, scale, isUpper, type };
      }
    }

    // View: TOP (Upper jaw Maxillary arch elegant horseshoe occlusal)
    if (view === 'top') {
      if (!isUpper) return { x: -999, y: -999, scale: 0, isUpper, type };
      const coord = occlusalCoords[idx];
      return { x: coord.x + panX, y: coord.y + panY, scale: 1.25, isUpper: true, type };
    }

    // View: BOTTOM (Lower jaw Mandibular arch elegant horseshoe occlusal)
    if (view === 'bottom') {
      if (isUpper) return { x: -999, y: -999, scale: 0, isUpper, type };
      const coord = occlusalCoords[31 - idx];
      // On the dental_bottom photo, front teeth (incisors) are at the top and molars are at the bottom,
      // mapping perfectly to the standard dome shape. Reversed to mirror standard left/right occlusion.
      return { x: coord.x + panX, y: coord.y + panY, scale: 1.25, isUpper: false, type };
    }

    // View: LEFT (Left buccal cheek perspective view showing entire arch from front to back)
    if (view === 'left') {
      if (isUpper) {
        const posFactor = 15 - idx; // left molar (15) is at front-left (0), right molar (0) curves to back-right (15)
        const x = 140 + posFactor * 48 + panX;
        const y = 218 + Math.sin(posFactor / 15 * Math.PI) * 16 + panY;
        const scale = type === 'molar' ? 1.08 : type === 'canine' ? 1.02 : 0.95;
        return { x, y, scale: scale * 1.02, isUpper, type };
      } else {
        const posFactor = 31 - idx; 
        const x = 140 + posFactor * 48 + panX;
        const y = 282 - Math.sin(posFactor / 15 * Math.PI) * 16 + panY;
        const scale = type === 'molar' ? 1.05 : type === 'canine' ? 0.98 : 0.92;
        return { x, y, scale: scale * 1.02, isUpper, type };
      }
    }

    // View: RIGHT (Right buccal cheek perspective view mirroring left perspective)
    if (view === 'right') {
      if (isUpper) {
        const posFactor = idx; // right molar (0) is at front-right (0), left molar (15) curves to back-left (15)
        const x = 140 + posFactor * 48 + panX;
        const y = 218 + Math.sin(posFactor / 15 * Math.PI) * 16 + panY;
        const scale = type === 'molar' ? 1.08 : type === 'canine' ? 1.02 : 0.95;
        return { x, y, scale: scale * 1.02, isUpper, type };
      } else {
        const posFactor = idx - 16;
        const x = 140 + posFactor * 48 + panX;
        const y = 282 - Math.sin(posFactor / 15 * Math.PI) * 16 + panY;
        const scale = type === 'molar' ? 1.05 : type === 'canine' ? 0.98 : 0.92;
        return { x, y, scale: scale * 1.02, isUpper, type };
      }
    }

    return { x: 500, y: 250, scale: 1, isUpper, type };
  };

  // Generate a continuous, beautifully scalloped, realistic pink gum arch for the jaw
  const getContinuousGumPath = (isUpper: boolean): string => {
    // Collect teeth indices belonging to this jaw
    const indices = isUpper 
      ? Array.from({ length: 16 }, (_, i) => i) // 0 to 15
      : Array.from({ length: 16 }, (_, i) => 16 + i); // 16 to 31

    const teethPoints = indices
      .map(idx => {
        const props = getToothDrawProps(idx);
        return { idx, ...props };
      })
      .filter(p => p.x !== -999);

    if (teethPoints.length === 0) return "";

    // Sort by X coordinate left-to-right (across the face)
    teethPoints.sort((a, b) => a.x - b.x);

    let path = "";
    
    // Height of the gums base line
    const gumBaseYOffset = isUpper ? -55 : 55;

    const first = teethPoints[0];
    const last = teethPoints[teethPoints.length - 1];

    // Begin at the outer edge of the first molar
    path += `M ${first.x - (18 * first.scale)}, ${first.y + gumBaseYOffset} `;

    // 1. Traverse left-to-right along the distant base boundary of the jaw bone/gumline
    for (let i = 0; i < teethPoints.length; i++) {
      const pt = teethPoints[i];
      const nextPt = teethPoints[i + 1];
      if (nextPt) {
        const midX = (pt.x + nextPt.x) / 2;
        const midY = ((pt.y + nextPt.y) / 2) + gumBaseYOffset;
        path += `Q ${pt.x}, ${pt.y + gumBaseYOffset} ${midX}, ${midY} `;
      } else {
        path += `L ${pt.x + (18 * pt.scale)}, ${pt.y + gumBaseYOffset} `;
      }
    }

    // 2. Wrap down/up side of the last teeth onto the cervical line neck
    path += `L ${last.x + (13 * last.scale)}, ${last.y} `;

    // 3. Scallop back right-to-left along the custom anatomical neck contour of each tooth
    for (let i = teethPoints.length - 1; i >= 0; i--) {
      const pt = teethPoints[i];
      const prevPt = teethPoints[i - 1];

      // Scallop width varies based on anatomical tooth type
      const w = pt.type === 'molar' ? 14 : pt.type === 'premolar' ? 10.5 : pt.type === 'canine' ? 9.5 : 9.5;
      const neckWidth = w * pt.scale;

      // The crest of the scallop curves up/down around the center of the tooth neck
      const scallopPeakY = isUpper ? pt.y - (4.5 * pt.scale) : pt.y + (4.5 * pt.scale);

      // Draw a smooth bezier curve wrapping this tooth's crown neck
      path += `C ${pt.x + neckWidth}, ${scallopPeakY} ${pt.x - neckWidth}, ${scallopPeakY} ${pt.x - neckWidth}, ${pt.y} `;

      // Shape the interdental papilla (the wedge of gum pointing down/up between adjacent teeth)
      if (prevPt) {
        const prevW = prevPt.type === 'molar' ? 14 : prevPt.type === 'premolar' ? 10.5 : prevPt.type === 'canine' ? 9.5 : 9.5;
        const prevNeckWidth = prevW * prevPt.scale;

        const papillaX = (pt.x - neckWidth + prevPt.x + prevNeckWidth) / 2;
        // For upper jaw, the gums peak downwards in the crevice (closer to y=positive)
        // For lower jaw, the gums peak upwards in the crevice (closer to y=negative)
        const papillaY = isUpper 
          ? ((pt.y + prevPt.y) / 2) + (5.5 * pt.scale)
          : ((pt.y + prevPt.y) / 2) - (5.5 * pt.scale);

        path += `Q ${papillaX}, ${papillaY} ${prevPt.x + prevNeckWidth}, ${prevPt.y} `;
      }
    }

    // Close the loop back to the starting upper/lower edge coordinate
    path += `Z`;
    return path;
  };

  // Check if occlusal biting surface should be shown
  const isOcclusal = view === 'top' || view === 'bottom';

  // Extract selected tooth coordinates for high-tech HUD vector lasers alignment tracking
  const activeDrawProps = getToothDrawProps(selectedToothIndex);
  const activeX = activeDrawProps.x;
  const activeY = activeDrawProps.y;
  const activeIsHidden = activeX === -999;

  return (
    <div 
      className="w-full h-full relative overflow-hidden flex flex-col justify-center items-center select-none cursor-grab active:cursor-grabbing" 
      style={{
        filter: `brightness(${brightness})`,
        transition: 'filter 0.255s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={(e) => {
        if (e.changedTouches.length > 0) {
          handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      }}
    >
      <style>{`
        @keyframes jawEllipseOrbitGentle {
          0% { transform: translate3d(0px, 1.5px, 0); }
          25% { transform: translate3d(4px, 0px, 0); }
          50% { transform: translate3d(0px, -1.5px, 0); }
          75% { transform: translate3d(-4px, 0px, 0); }
          100% { transform: translate3d(0px, 1.5px, 0); }
        }
        @keyframes jawEllipseOrbitActive {
          0% { transform: translate3d(0px, 5px, 0); }
          25% { transform: translate3d(22px, 0px, 0); }
          50% { transform: translate3d(0px, -5px, 0); }
          75% { transform: translate3d(-22px, 0px, 0); }
          100% { transform: translate3d(0px, 5px, 0); }
        }
        .jaw-float-gentle {
          animation: jawEllipseOrbitGentle 14s ease-in-out infinite;
        }
        .jaw-float-active {
          animation: jawEllipseOrbitActive 5s ease-in-out infinite;
        }
      `}</style>

      {/* 1. HIGH-TECH CLINICAL CYBER OVERLAYS REMOVED BY USER REQUEST */}



      {/* GESTURE FEEDBACK MICRO DISPLAY */}
      {dragFeedBack && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#020914]/85 border border-[#00f2fe]/30 text-[#00f2fe] text-[9.5px] font-mono tracking-widest uppercase font-black px-4 py-2 rounded-xl backdrop-blur-md shadow-2xl pointer-events-none z-20 flex items-center gap-2 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{dragFeedBack}</span>
        </div>
      )}



      <div className="absolute bottom-12 right-5 text-[8px] font-mono text-emerald-400/80 tracking-widest bg-[#020a16]/65 px-2.5 py-1.5 rounded border border-emerald-500/10 pointer-events-none z-10">
        AI DENTAL RENDERER 60.0 FPS
      </div>

      {/* 2. THE CORE EXTREMELY POLISHED INTERACTIVE SVG DENTAL ENGINE */}
      <div 
        className="w-full h-full flex items-center justify-center transition-all duration-300"
        style={{
          transform: `scale(${zoomLevel})`,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <svg 
          viewBox="0 0 1000 520" 
          className="w-full h-full max-h-[480px] drop-shadow-[0_0_40px_rgba(3,15,31,0.9)] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS FOR REALISTIC GRADIENTS AND EFFECTS */}
          <defs>
            {/* Ultra-realistic Enamel Gradients (warm, pearlescent enamel shading) */}
            <linearGradient id="enamelGradUpper" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#eedfcc" /> {/* warm cervical neck shading */}
              <stop offset="12%" stopColor="#fffcf5" />
              <stop offset="55%" stopColor="#ffffff" /> {/* vibrant milky body */}
              <stop offset="85%" stopColor="#f7f5ef" />
              <stop offset="96%" stopColor="#e3edf6" /> {/* translucent incisal hint */}
              <stop offset="100%" stopColor="#b4c7d6" /> {/* blue-grey translucent edge */}
            </linearGradient>
            <linearGradient id="enamelGradLower" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b4c7d6" /> {/* translucent crown tip */}
              <stop offset="8%" stopColor="#e3edf6" />
              <stop offset="20%" stopColor="#f7f5ef" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="88%" stopColor="#fffcf5" />
              <stop offset="100%" stopColor="#eedfcc" /> {/* warm neck edge */}
            </linearGradient>

            {/* Occlusal flat face shading (Gives 3D depth to chewing view) */}
            <radialGradient id="occlusalToothGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ebdcb8" /> {/* darker central crevasse */}
              <stop offset="45%" stopColor="#fdfcf5" />
              <stop offset="85%" stopColor="#ffffff" /> {/* bright rim */}
              <stop offset="100%" stopColor="#c5b69c" /> {/* shaded boundary */}
            </radialGradient>

            {/* Selected glow enamel */}
            <linearGradient id="selectedEnamelGradUpper" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ebfeff" />
              <stop offset="45%" stopColor="#a3fefe" />
              <stop offset="100%" stopColor="#0baab4" />
            </linearGradient>
            <linearGradient id="selectedEnamelGradLower" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0baab4" />
              <stop offset="55%" stopColor="#a3fefe" />
              <stop offset="100%" stopColor="#ebfeff" />
            </linearGradient>

            {/* Selected Occlusal Glow */}
            <radialGradient id="selectedOcclusalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0bb7c2" />
              <stop offset="60%" stopColor="#adffff" />
              <stop offset="100%" stopColor="#e2ffff" />
            </radialGradient>

            {/* Tooth Roots Gradients */}
            <linearGradient id="rootGradUpper" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dab588" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#be9361" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="rootGradLower" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#be9361" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#dab588" stopOpacity="0.85" />
            </linearGradient>

            {/* Pulsing inner pulpal chambers core gradients */}
            <linearGradient id="pulpChamberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* SCI-FI Diagnostic gradient colors */}
            <linearGradient id="aiHealthyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="aiHealthyOcclusal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="80%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* SCI-FI Warnings/Danger gradient colors */}
            <linearGradient id="aiWarningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="aiWarningOcclusal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="80%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="aiDangerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="aiDangerOcclusal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="80%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>

            {/* Custom Radiograph/X-Ray style gradients */}
            <linearGradient id="xrayEnamelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id="xraySelectedEnamelGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#00c8ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.55" />
            </radialGradient>

            {/* Advanced Pink-Rose Mucosal Gums Gradients */}
            <linearGradient id="gumsUpperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#400b1a" /> {/* deep sulcus shadow */}
              <stop offset="42%" stopColor="#db2777" stopOpacity="0.95" /> {/* warm attached gingiva */}
              <stop offset="82%" stopColor="#fda4af" /> {/* moist marginal papillae pink */}
              <stop offset="100%" stopColor="#e11d48" /> {/* vascular margin edge */}
            </linearGradient>
            <linearGradient id="gumsLowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" /> {/* marginal pink */}
              <stop offset="22%" stopColor="#e11d48" />
              <stop offset="58%" stopColor="#db2777" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4a081a" /> {/* deep vestibule dark shadow */}
            </linearGradient>

            {/* Dark Wet Mouth Cavity Inside Background Area */}
            <radialGradient id="jawCavityBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e0208" stopOpacity="0.98" />
              <stop offset="65%" stopColor="#0d0105" stopOpacity="0.99" />
              <stop offset="100%" stopColor="#010001" stopOpacity="1" />
            </radialGradient>

            {/* 3D Rounding Cylindrical Lateral Shadow for Teeth */}
            <linearGradient id="toothShadowHorizontal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5c4a38" stopOpacity="0.45" /> {/* left interproximal shade */}
              <stop offset="10%" stopColor="#8c7863" stopOpacity="0.18" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.12" /> {/* left specular lobe */}
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" /> {/* front facial flat lobe */}
              <stop offset="72%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="90%" stopColor="#544331" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#36291b" stopOpacity="0.55" /> {/* right interproximal shade */}
            </linearGradient>

            {/* Wet Liquid Specular Glow along scalloped margins */}
            <linearGradient id="gumShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffe5ed" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
            </linearGradient>

            {/* Alveolar Bone clinical radiographic grid glow */}
            <radialGradient id="boneShieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#081f3e" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#041227" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020813" stopOpacity="0" />
            </radialGradient>

            {/* Clinical neon green/blue jawbone outline glow filters */}
            <filter id="neonTealGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* THE PHOTOREALISTIC 3D MEDICAL BACKDROP */}
          <image 
            href={viewImages[view]} 
            x="0" 
            y="0" 
            width="1000" 
            height="520" 
            preserveAspectRatio="none" 
            opacity={renderMode === 'x-ray' ? '0.45' : '0.95'} 
            className="transition-all duration-300 pointer-events-none"
            style={{ 
              pointerEvents: 'none',
              filter: renderMode === 'x-ray' 
                ? 'grayscale(100%) invert(45%) sepia(100%) saturate(180%) hue-rotate(185deg) brightness(0.6) contrast(1.5)' 
                : 'none'
            }}
          />

          {/* DIAGNOSTIC CONCENTRIC RANGEFINDER HUD BACKGROUND */}
          <g opacity="0.6">
            <circle cx="500" cy="250" r="140" stroke="rgba(0, 242, 254, 0.05)" strokeWidth="1" fill="none" />
            <circle cx="500" cy="250" r="240" stroke="rgba(0, 242, 254, 0.035)" strokeWidth="1" strokeDasharray="3,3" fill="none" />
            <circle cx="500" cy="250" r="320" stroke="rgba(0, 242, 254, 0.02)" strokeWidth="1.5" strokeDasharray="8,8" fill="none" />
            <line x1="500" y1="30" x2="500" y2="470" stroke="rgba(0, 242, 254, 0.012)" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="100" y1="250" x2="900" y2="250" stroke="rgba(0, 242, 254, 0.012)" strokeWidth="1" strokeDasharray="4,4" />
          </g>

          {/* 3. CLINICAL NEON GLOWING HOLOGRAPHIC SKULL/JAWBONE OUTLINE IN BACKGROUND */}
          <g className={autoRotate ? 'jaw-float-active' : 'jaw-float-gentle'}>
            {showBone && (
            <g filter="url(#neonTealGlow)" opacity="0.33" transition="opacity 0.3s ease">
              {view === 'front' && (
                <g stroke="#00f2fe" strokeWidth="2" strokeDasharray="14,14" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* Stylized Maxilla Bone Top Arc */}
                  <path d="M 120,110 Q 500,-10 880,110" />
                  {/* Nasal Cavity Outline */}
                  <path d="M 460,80 L 485,35 L 500,30 L 515,35 L 540,80 L 520,120 L 480,120 Z" strokeWidth="1.5" />
                  {/* Upper Cheekbone Orbits */}
                  <ellipse cx="280" cy="65" rx="55" ry="32" strokeWidth="1.5" />
                  <ellipse cx="720" cy="65" rx="55" ry="32" strokeWidth="1.5" />
                  {/* Stylized Mandible Chin Bone Bottom Loop */}
                  <path d="M 110,380 Q 500,540 890,380 L 810,443 L 720,448 Q 500,475 280,448 L 190,443 Z" />
                </g>
              )}
              {isOcclusal && (
                <g stroke="#00f2fe" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  {/* Beautiful horseshoe anatomical alveolar ridge backing */}
                  <path d="M 320,440 C 320,200 370,45 500,45 C 630,45 680,200 680,440" strokeDasharray="10,10" />
                  <ellipse cx="500" cy="250" rx="360" ry="210" strokeWidth="1" opacity="0.15" />
                </g>
              )}
              {(view === 'left' || view === 'right') && (
                <g stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {/* Profile view of mandibular hinge joint and chin sweep */}
                  <path d="M 150,110 Q 350,120 700,160 L 780,100 L 810,240 L 750,380 Q 450,440 180,380 Z" strokeDasharray="6,6" />
                </g>
              )}
            </g>
          )}

          {/* ALVEOLAR BONE RADIOGRAPH SHIELD UNDERLAY */}
          {showBone && (view === 'front' || view === 'left' || view === 'right') && (
            <g transition="opacity 0.3s ease" style={{ opacity: showBone ? 0.35 : 0 }}>
              <ellipse cx="500" cy="110" rx="390" ry="100" fill="url(#boneShieldGrad)" stroke="rgba(0, 242, 254, 0.05)" strokeWidth="1.5" />
              <ellipse cx="500" cy="380" rx="380" ry="105" fill="url(#boneShieldGrad)" stroke="rgba(0, 242, 254, 0.05)" strokeWidth="1.5" />
            </g>
          )}

          {/* 3.5 DEEP BIOLOGICAL ORAL CAVITY DARKNESS (Mouth interior backdrop for immense 3D contrast) */}
          {!isOcclusal && (
            <ellipse 
              cx="500" 
              cy="252" 
              rx="404" 
              ry="128" 
              fill="url(#jawCavityBg)" 
              opacity={renderMode === 'realistic' ? 0.0 : 0.94} 
              className="transition-all duration-300" 
            />
          )}

          {/* 4. SEAMLESS BIOLOGICAL SCALLOPED GUMS (FRONT/PROFILE VIEWS ONLY) */}
          {!isOcclusal && (
            <g className="transition-all duration-300" opacity={renderMode === 'realistic' ? 0.0 : 1.0}>
              {/* Upper continuous gum arch */}
              {(jawView === 'both' || jawView === 'upper') && (
                <g>
                  {/* Outer shadow for 3D depth */}
                  <path 
                    d={getContinuousGumPath(true)} 
                    fill="rgba(40, 2, 10, 0.55)" 
                    filter="url(#softGlow)" 
                    transform="translate(0, 2)"
                  />
                  {/* Organic base gums */}
                  <path 
                    d={getContinuousGumPath(true)} 
                    fill="url(#gumsUpperGrad)" 
                    stroke="rgba(190, 15, 60, 0.22)" 
                    strokeWidth="0.8"
                  />
                  {/* Specular wet highlight margin line */}
                  <path 
                    d={getContinuousGumPath(true)} 
                    fill="none" 
                    stroke="url(#gumShine)" 
                    strokeWidth="1.5" 
                    opacity="0.75"
                  />
                </g>
              )}

              {/* Lower continuous gum arch */}
              {(jawView === 'both' || jawView === 'lower') && (
                <g>
                  {/* Outer shadow for 3D depth */}
                  <path 
                    d={getContinuousGumPath(false)} 
                    fill="rgba(40, 2, 10, 0.55)" 
                    filter="url(#softGlow)" 
                    transform="translate(0, -2)"
                  />
                  {/* Organic base gums */}
                  <path 
                    d={getContinuousGumPath(false)} 
                    fill="url(#gumsLowerGrad)" 
                    stroke="rgba(180, 15, 55, 0.22)" 
                    strokeWidth="0.8"
                  />
                  {/* Specular wet highlight margin line */}
                  <path 
                    d={getContinuousGumPath(false)} 
                    fill="none" 
                    stroke="url(#gumShine)" 
                    strokeWidth="1.5" 
                    opacity="0.75"
                  />
                </g>
              )}
            </g>
          )}

          {/* 5. THE REALISTIC SHADED TEETH GROWN ELEMENT STRUCTURES */}
          <g>
            {Array.from({ length: 32 }).map((_, idx) => {
              const isUpper = idx < 16;
              const { x, y, scale, type } = getToothDrawProps(idx);
              const isSelected = idx === selectedToothIndex;

              // Hide if outside active profile views boundaries
              if (x === -999) return null;

              // Filter based on active upper/lower jaw setting
              if (jawView === 'upper' && !isUpper) return null;
              if (jawView === 'lower' && isUpper) return null;

              const metrics = getToothMetrics(idx);
              const score = metrics.health;

              // Compute anatomically perfect, non-overlapping offsets for interactive number badges:
              // - In occlusal profile (TOP/BOTTOM): shift badges OUTWARD from the jaw curve center, leaving the crown 100% visible
              // - In perspective profiles (FRONT/LEFT/RIGHT): shift upper badges UPWARD (negative y) and lower badges DOWNWARD (positive y)
              let badgeTransform = `translate(0, ${isUpper ? -46 : 46})`;
              if (isOcclusal) {
                const centerX = 500;
                const centerY = view === 'top' ? 300 : 250;
                const dx = x - centerX;
                const dy = y - centerY;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                // Since the parent group is scaled by scale (normally 1.25), 
                // we divide the desired screen offset distance (approx 52px) by scale.
                const offsetDistance = 52 / (scale || 1.25);
                const bx = (dx / len) * offsetDistance;
                const by = (dy / len) * offsetDistance;
                badgeTransform = `translate(${bx}, ${by})`;
              }

              // Determine fill gradients based on current rendering mode and AI diagnostic score
              let crownFill = isUpper ? "url(#enamelGradUpper)" : "url(#enamelGradLower)";
              if (isOcclusal) {
                crownFill = "url(#occlusalToothGrad)";
              }

              if (renderMode === 'x-ray') {
                crownFill = isSelected ? "url(#xraySelectedEnamelGrad)" : "url(#xrayEnamelGrad)";
              } else if (renderMode === 'ai-diagnostic' || score < 82) {
                if (score >= 82) {
                  crownFill = isOcclusal ? "url(#aiHealthyOcclusal)" : "url(#aiHealthyGrad)";
                } else if (score >= 70) {
                  crownFill = isOcclusal ? "url(#aiWarningOcclusal)" : "url(#aiWarningGrad)";
                } else {
                  crownFill = isOcclusal ? "url(#aiDangerOcclusal)" : "url(#aiDangerGrad)";
                }
              } else if (isSelected) {
                // Shiny teal clinical selection gradient overrides
                if (isOcclusal) {
                  crownFill = "url(#selectedOcclusalGrad)";
                } else {
                  crownFill = isUpper ? "url(#selectedEnamelGradUpper)" : "url(#selectedEnamelGradLower)";
                }
              }

              // Path geometries
              const crownPath = getToothCrownPath(type, isUpper, isOcclusal);
              const highlightPath = getToothHighlightPath(type, isUpper, isOcclusal);

              return (
                <g 
                  key={idx} 
                  transform={`translate(${x}, ${y}) scale(${scale})`}
                  className="transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    if (isDraggingRef.current) return;
                    setSelectedToothIndex(idx);
                  }}
                >
                  {/* ROOT SYSTEM CANALS (Ildizlar) */}
                  {showRoots && !isOcclusal && (
                    <g opacity={isSelected ? 1.0 : 0.72} className="transition-all duration-300">
                      {getToothRootPaths(type, isUpper).map((rootPath, rootIdx) => (
                        <g key={rootIdx}>
                          {/* Outer root dentin sleeve */}
                          <path 
                            d={rootPath} 
                            fill={isUpper ? "url(#rootGradUpper)" : "url(#rootGradLower)"} 
                            stroke="rgba(190, 147, 97, 0.45)" 
                            strokeWidth="1.1" 
                          />
                          {/* Inner glowing red/pink nerve/pulp root canal path */}
                          <path 
                            d={rootPath} 
                            fill="url(#pulpChamberGrad)" 
                            opacity="0.77"
                            transform="scale(0.38, 0.88)"
                            className="transition-all duration-300"
                          />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* ACTIVE TOOTH CROSS-SECTION VIEW INFOGRAPHICS (PULPA/DENTIN ANALYSIS INTERNALS) */}
                  {crossSection && isSelected && !isOcclusal ? (
                    <g id="cross-section-internals" className="animate-pulse">
                      {/* Enamel slice layer */}
                      <path 
                        d={crownPath} 
                        fill="rgba(248, 248, 242, 0.82)" 
                        stroke="#00f2fe" 
                        strokeWidth="1.6" 
                      />
                      {/* Thick yellow Dentin inner layer */}
                      <path 
                        d={crownPath} 
                        fill="#fbbf24" 
                        opacity="0.84" 
                        transform="scale(0.72, 0.72)" 
                      />
                      {/* Vascular Red Pulp Core Nerve */}
                      <path 
                        d={crownPath} 
                        fill="url(#pulpChamberGrad)" 
                        opacity="0.95" 
                        transform="scale(0.35, 0.35)" 
                      />
                    </g>
                  ) : (
                    // STANDARD HIGH-FIDELITY CROWN ELEMENT (Tish toji)
                    <g>
                      {/* Interproximal spacing drop shadow line beneath each crown to divide them naturally */}
                      {renderMode !== 'realistic' && (
                        <path 
                          d={crownPath} 
                          fill="none" 
                          stroke="rgba(11, 2, 4, 0.75)" 
                          strokeWidth="2.4" 
                        />
                      )}

                      {/* Tooth Crown Main Base Shape */}
                      <path 
                        d={crownPath} 
                        fill={crownFill} 
                        fillOpacity={
                          renderMode === 'x-ray'
                            ? (isSelected ? 0.45 : 0.22)
                            : isSelected 
                            ? 0.75 
                            : score < 50 
                            ? 0.65 // Highlight critical issues on the crown!
                            : score < 82 
                            ? 0.52 // Highlight warnings on the crown!
                            : renderMode === 'realistic' 
                            ? 0.15 // Soft realistic healthy tooth highlight pearlescence
                            : 0.65
                        }
                        stroke={
                          renderMode === 'x-ray'
                            ? (isSelected ? "#00f2fe" : "rgba(186, 230, 253, 0.45)")
                            : isSelected 
                            ? "#00f2fe" 
                            : score < 50 
                            ? "#f43f5e" 
                            : score < 82 
                            ? "#f59e0b" 
                            : renderMode === 'realistic' 
                            ? "rgba(16, 185, 129, 0.25)" 
                            : "rgba(100, 116, 140, 0.28)"
                        }
                        strokeWidth={
                          renderMode === 'x-ray'
                            ? (isSelected ? "2.2" : "1.1")
                            : isSelected 
                            ? "2.2" 
                            : score < 50 
                            ? "1.8" 
                            : score < 82 
                            ? "1.4" 
                            : "0.85"
                        }
                        className="interactive-tooth-path"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.65))' : 'none',
                          pointerEvents: 'all'
                        }}
                      />

                      {/* Radiograph translucent dentin/pulp internal layers inside main crown */}
                      {renderMode === 'x-ray' && (
                        <>
                          <path 
                            d={crownPath} 
                            fill="#0284c7" 
                            opacity="0.18" 
                            transform="scale(0.72, 0.72)" 
                            pointerEvents="none"
                          />
                          <path 
                            d={crownPath} 
                            fill="#38bdf8" 
                            opacity="0.32" 
                            transform="scale(0.35, 0.35)" 
                            pointerEvents="none"
                          />
                        </>
                      )}

                      {/* 3D Rounding Cylindrical Lateral Shadow overlay */}
                      {!isOcclusal && renderMode !== 'realistic' && (
                        <path 
                          d={crownPath} 
                          fill="url(#toothShadowHorizontal)" 
                          pointerEvents="none" 
                          opacity={0.45}
                        />
                      )}

                      {/* Shiny High Gloss Specular Reflection overlay line (Gives that photorealistic moist shine!) */}
                      {renderMode === 'realistic' && (
                        <path 
                          d={highlightPath} 
                          fill="none" 
                          stroke="rgba(255, 255, 255, 0.65)" 
                          strokeWidth={isOcclusal ? "1.8" : "1.4"} 
                          strokeLinecap="round" 
                          pointerEvents="none" 
                        />
                      )}

                      {/* Small sparkling white pinpoint reflection spot */}
                      {renderMode === 'realistic' && !isOcclusal && (
                        <ellipse 
                          cx={isUpper ? "-6" : "-5"} 
                          cy={isUpper ? "8" : "-8"} 
                          rx="1.5" 
                          ry="3.5" 
                          fill="rgba(255, 255, 255, 0.8)" 
                          transform="rotate(-15)" 
                          pointerEvents="none" 
                        />
                      )}
                      
                      {/* Anatomical masticatory fissure lines for molar & premolar crowns */}
                      {(type === 'molar' || type === 'premolar') && renderFissures(type, isUpper, isOcclusal)}

                      {/* Realistic Active Pathological Cavity Caries crater (if pathology >= 40 in realistic) */}
                      {renderMode === 'realistic' && metrics.caries >= 40 && !isOcclusal && (
                        <ellipse 
                          cx={isUpper ? "4" : "5"} 
                          cy={isUpper ? "18" : "-16"} 
                          rx={metrics.caries > 60 ? "3.2" : "2"} 
                          ry={metrics.caries > 60 ? "2" : "1.2"} 
                          fill="#261710" 
                          stroke="#1a100a" 
                          strokeWidth="0.8" 
                        />
                      )}

                      {/* INVISIBLE HIGH-SENSITIVITY HIT TARGET FOR PERFECT CLICKS */}
                      <path 
                        d={crownPath} 
                        fill="rgba(0, 242, 254, 0)" 
                        stroke="transparent"
                        strokeWidth="5" 
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDraggingRef.current) return;
                          setSelectedToothIndex(idx);
                        }}
                      />
                    </g>
                  )}

                  {/* PERSISTENT HIGH-FIDELITY INTERACTIVE DYNAMIC TOOTH NUMBER HUD BADGES ON THE MODEL */}
                  <g 
                    transform={badgeTransform}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDraggingRef.current) return;
                      setSelectedToothIndex(idx);
                    }}
                  >
                    {/* Ring outer perimeter indicator */}
                    {isSelected ? (
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="16" 
                        fill="none" 
                        stroke="#00f2fe" 
                        strokeWidth="0.8" 
                        strokeDasharray="2,2"
                        className="animate-spin"
                        style={{ transformOrigin: '0px 0px', animationDuration: '10s' }}
                      />
                    ) : score < 50 ? (
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="16" 
                        fill="none" 
                        stroke="#f43f5e" 
                        strokeWidth="1.2" 
                        strokeDasharray="3,3"
                        className="animate-pulse"
                        style={{ transformOrigin: '0px 0px' }}
                      />
                    ) : score < 82 ? (
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="14" 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="0.8" 
                        opacity="0.6"
                      />
                    ) : (
                      <circle 
                        cx="0" 
                        cy="0" 
                        r="14" 
                        fill="none" 
                        stroke="rgba(16, 185, 129, 0.45)" 
                        strokeWidth="0.8" 
                      />
                    )}

                    {/* Circle Background Badge */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="11.5" 
                      fill={
                        isSelected 
                          ? "rgba(0, 242, 254, 0.95)" 
                          : score < 50 
                          ? "rgba(244, 63, 94, 0.95)" 
                          : score < 82 
                          ? "rgba(245, 158, 11, 0.95)" 
                          : "rgba(3, 10, 24, 0.85)"
                      } 
                      stroke={
                        isSelected 
                          ? "#00f2fe" 
                          : score < 50 
                          ? "#f43f5e" 
                          : score < 82 
                          ? "#f59e0b" 
                          : "#10b981"
                      } 
                      strokeWidth={isSelected ? "2.0" : score < 82 ? "1.8" : "1.2"}
                      style={{ 
                        filter: isSelected 
                          ? 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.6))' 
                          : score < 50 
                          ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.7))'
                          : score < 82
                          ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))'
                          : 'none', 
                        pointerEvents: 'all' 
                      }}
                      className="transition-all duration-300 hover:brightness-125"
                    />

                    {/* Tooth system formatted representation number */}
                    <text 
                      x="0" 
                      y="3.2" 
                      fill={isSelected ? "#020813" : score < 82 ? "#ffffff" : "#a7f3d0"} 
                      className="text-[10px] font-mono font-black"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', fontWeight: 900 }}
                    >
                      {getToothDisplayNumber ? getToothDisplayNumber(idx, dentalSystem || 'fdi') : (
                        (dentalSystem || 'fdi') === 'universal' ? (
                          idx < 16 ? idx + 1 : (idx < 24 ? 32 - (idx - 16) : 24 - (idx - 24))
                        ) : (
                          idx < 8 ? 18 - idx : (idx < 16 ? 21 + (idx - 8) : (idx < 24 ? 48 - (idx - 16) : 31 + (idx - 24)))
                        )
                      )}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 6. ADVANCED HOLOGRAPHIC DIAGNOSTIC LOCK-ON SCAN TARGET (Reticle HUD) */}
          {!activeIsHidden && (
            <g transform={`translate(${activeX}, ${activeY})`}>
              {/* Spinning circular cyber targeting crosshair */}
              <circle 
                cx="0" 
                cy="0" 
                r={isOcclusal ? "28" : "38"} 
                stroke="#00f2fe" 
                strokeWidth="1.2" 
                strokeDasharray="6,6" 
                fill="none" 
                className="animate-spin"
                style={{ transformOrigin: '0px 0px', animationDuration: '9s' }}
              />

              {/* Multi-axial targeting focal corners */}
              <circle cx="0" cy="0" r="46" stroke="rgba(0, 242, 254, 0.28)" strokeWidth="0.8" fill="none" />
              <line x1="-54" y1="0" x2="-38" y2="0" stroke="#00f2fe" strokeWidth="1.2" />
              <line x1="38" y1="0" x2="54" y2="0" stroke="#00f2fe" strokeWidth="1.2" />
              <line x1="0" y1="-54" x2="0" y2="-38" stroke="#00f2fe" strokeWidth="1.2" />
              <line x1="0" y1="38" x2="0" y2="54" stroke="#00f2fe" strokeWidth="1.2" />

              {/* Pulsating diagnostic center beacon matching current health condition */}
              <circle 
                cx="0" 
                cy="0" 
                r="4.5" 
                fill={getToothMetrics(selectedToothIndex).health < 50 ? "#f43f5e" : "#10b981"} 
                className="animate-ping" 
                style={{ animationDuration: '1.4s' }}
              />
              <circle 
                cx="0" 
                cy="0" 
                r="3.5" 
                fill={getToothMetrics(selectedToothIndex).health < 50 ? "#ef4444" : "#10b981"} 
              />

              {/* Live laser diagnostic scan horizontal sweep line */}
              {scanActive && (
                <line 
                  x1="-32" 
                  y1="-10" 
                  x2="32" 
                  y2="10" 
                  stroke="#00f2fe" 
                  strokeWidth="2" 
                  className="animate-bounce"
                  style={{ animationDuration: '0.82s', filter: 'drop-shadow(0 0 6px #00f2fe)' }}
                />
              )}
            </g>
          )}

          {/* 7. COLLATERAL RADAR LASER DRAGLINE LINKING TO CLINICAL METRICS (Floating medical leads) */}
          {!activeIsHidden && (
            <g>
              {/* Cyber coordinate lead tracer laser line */}
              <path 
                d={`M 915,55 L ${activeX + 18},${activeY - 18}`} 
                stroke="rgba(0, 242, 254, 0.35)" 
                strokeWidth="1.2" 
                strokeDasharray="4,4" 
                fill="none" 
              />
              <circle cx="915" cy="55" r="3.5" fill="#00f2fe" />
              {/* Telemetry coordinate HUD tag display */}
              <g transform="translate(915, 55)">
                <text x="12" y="3" className="text-[10px] font-mono fill-cyan-400 font-bold tracking-widest uppercase">
                  FOCAL_TARGET: #{getToothMetrics(selectedToothIndex).health < 50 ? 'SYS_CRIT' : 'SYS_STAB'}
                </text>
              </g>
            </g>
          )}
          </g>
        </svg>
      </div>

      {/* 3. LOWER HORIZONTAL PRESENCE SELECT LABELS (Removed to prevent obstructing the tooth layout) */}
    </div>
  );
}
