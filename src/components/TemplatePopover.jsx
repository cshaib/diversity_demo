// import React, { useRef, useEffect } from 'react';
// import { X } from 'lucide-react';

// const TemplatePopover = ({ matches, anchorRect, onClose, modelColors }) => {
// const popoverRef = useRef(null);

// useEffect(() => {
//     if (!popoverRef.current || !anchorRect) return;

//     const popover = popoverRef.current;
//     const { top, bottom, left, right } = anchorRect;
//     const viewportHeight = window.innerHeight;
//     const viewportWidth = window.innerWidth;
//     const MARGIN = 16;

//     let popoverTop = bottom + MARGIN;
//     let popoverLeft = left;

//     const popoverHeight = popover.offsetHeight;
//     const popoverWidth = popover.offsetWidth;

//     if (popoverTop + popoverHeight > viewportHeight - MARGIN) {
//     popoverTop = top - popoverHeight - MARGIN;
//     }

//     if (popoverLeft + popoverWidth > viewportWidth - MARGIN) {
//     popoverLeft = Math.max(MARGIN, right - popoverWidth);
//     }

//     popoverTop = Math.max(MARGIN, Math.min(popoverTop, viewportHeight - popoverHeight - MARGIN));
//     popoverLeft = Math.max(MARGIN, Math.min(popoverLeft, viewportWidth - popoverWidth - MARGIN));

//     popover.style.transition = 'top 0.2s ease-out, left 0.2s ease-out';
//     popover.style.top = `${popoverTop}px`;
//     popover.style.left = `${popoverLeft}px`;
// }, [anchorRect]);

// const groupedMatches = matches.reduce((acc, match) => {
//     if (!acc[match.pattern]) {
//     acc[match.pattern] = {
//         pattern: match.pattern,
//         text: match.text,
//         models: new Set([match.templateName])
//     };
//     } else {
//     acc[match.pattern].models.add(match.templateName);
//     }
//     return acc;
// }, {});

// return (
//     <div
//     ref={popoverRef}
//     style={{ 
//         position: 'fixed',
//         zIndex: 50,
//         width: '320px',
//         transform: 'translate3d(0, 0, 0)'  
//     }}
//     className="bg-white rounded-lg shadow-lg border border-gray-200"
//     onClick={(e) => e.stopPropagation()}
//     >
//     <div className="flex items-center justify-between p-3 border-b border-gray-200">
//         <h3 className="text-sm font-medium text-gray-900">Template Details</h3>
//         <button
//         onClick={onClose}
//         className="text-gray-400 hover:text-gray-500 focus:outline-none"
//         >
//         <X className="w-4 h-4" />
//         </button>
//     </div>

//     <div className="p-4 space-y-4">
//         {Object.values(groupedMatches).map((match, index) => (
//         <div key={index} className="space-y-2">
//             <div>
//             <label className="block text-xs font-medium text-gray-500">Template Pattern</label>
//             <div className="mt-1 text-sm text-gray-900">{match.pattern}</div>
//             </div>

//             <div>
//             <label className="block text-xs font-medium text-gray-500">Matching Models</label>
//             <div className="mt-1 flex flex-wrap gap-2">
//                 {Array.from(match.models).map((model, idx) => (
//                 <span 
//                     key={idx} 
//                     className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
//                 >
//                     <span className={`w-2 h-2 rounded-full ${modelColors[model]}`} />
//                     {model}
//                 </span>
//                 ))}
//             </div>
//             </div>

//             <div>
//             <label className="block text-xs font-medium text-gray-500">Matched Text</label>
//             <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">{match.text}</div>
//             </div>

//             {index < Object.values(groupedMatches).length - 1 && (
//             <div className="border-b border-gray-100 pt-2" />
//             )}
//         </div>
//         ))}
//     </div>
//     </div>
// );
// };

// export default TemplatePopover;