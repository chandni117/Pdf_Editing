// // src/PdfEditor.js
// import React, { useState, useRef } from 'react';
// import { Document, Page, pdfjs } from 'react-pdf';
// import { PDFDocument, rgb } from 'pdf-lib';
// import SignatureCanvas from 'react-signature-canvas';

// // Use CDN for worker (you can switch to local if needed)
// pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// const PdfEditor = () => {
//   const [pdfFile, setPdfFile] = useState(null);
//   const [numPages, setNumPages] = useState(0);
//   const [formFields, setFormFields] = useState([]);
//   const sigCanvas = useRef({});

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file && file.type === 'application/pdf') {
//       setPdfFile(URL.createObjectURL(file));
//     }
//   };

//   const onDocumentLoadSuccess = ({ numPages }) => {
//     setNumPages(numPages);
//   };

//   const addField = (type) => {
//     setFormFields([...formFields, { type, value: '', x: 100, y: 100 }]);
//   };

//   const saveModifiedPdf = async () => {
//     const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
//     const pdfDoc = await PDFDocument.load(existingPdfBytes);
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     // Add form fields to the PDF
//     formFields.forEach((field) => {
//       if (field.type === 'text') {
//         firstPage.drawText(field.value, {
//           x: field.x,
//           y: field.y,
//           size: 12,
//           color: rgb(0, 0, 0),
//         });
//       }
//       // You can implement checkbox and radio buttons similarly as needed.
//     });

//     // Add e-signature if available
//     if (sigCanvas.current && sigCanvas.current.isEmpty() === false) {
//       const pngImageBytes = sigCanvas.current.getTrimmedCanvas().toDataURL();
//       const pngImage = await pdfDoc.embedPng(pngImageBytes);
//       firstPage.drawImage(pngImage, { x: 150, y: 150, width: 200, height: 100 });
//     }

//     const pdfBytes = await pdfDoc.save();
//     download(pdfBytes, "modified.pdf", "application/pdf");
//   };

//   const download = (data, fileName, mimeType) => {
//     const blob = new Blob([data], { type: mimeType });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = fileName;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div>
//       <h1>PDF Editor</h1>
//       <input type="file" accept="application/pdf" onChange={handleFileUpload} />

//       {pdfFile && (
//         <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
//           {Array.from(new Array(numPages), (el, index) => (
//             <Page key={index} pageNumber={index + 1} />
//           ))}
//         </Document>
//       )}

//       <div>
//         <button onClick={() => addField('text')}>Add Text Field</button>
//         <button onClick={() => addField('checkbox')}>Add Checkbox</button>
//         <button onClick={() => addField('radio')}>Add Radio Button</button>
//         <button onClick={() => addField('esign')}>Add E-Signature</button>
//       </div>

//       {formFields.map((field, index) => (
//         <div key={index} style={{ position: 'absolute', top: field.y, left: field.x }}>
//           {field.type === 'text' && (
//             <input
//               type="text"
//               value={field.value}
//               onChange={(e) => {
//                 const updatedFields = [...formFields];
//                 updatedFields[index].value = e.target.value;
//                 setFormFields(updatedFields);
//               }}
//             />
//           )}
//           {field.type === 'checkbox' && <input type="checkbox" />}
//           {field.type === 'radio' && <input type="radio" />}
//           {field.type === 'esign' && <SignatureCanvas ref={sigCanvas} penColor="black" />}
//         </div>
//       ))}

//       <button onClick={saveModifiedPdf}>Save PDF</button>
//     </div>
//   );
// };

// export default PdfEditor;
// src/PdfEditor.js
// src/PdfEditor.js
// src/PdfEditor.js
// src/PdfEditor.js
import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas';
import './PdfEditor.css';
//import worker from 'pdfjs-dist/build/pdf.worker.entry';

// Set the workerSrc for PDF.js
//pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

//pdfjs.GlobalWorkerOptions.workerSrc = worker;
const PdfEditor = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url)
    .toString();
    console.log(pdfjs.GlobalWorkerOptions.workerSrc);
    
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [formFields, setFormFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const sigCanvas = useRef(null);

  console.log("Current pdfFile:", pdfFile); 
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      console.log("Selected file:", file); // Log File object
            const fileUrl = URL.createObjectURL(file); // Create object URL
            setPdfFile(fileUrl); // Update state
            console.log("PDF URL:", fileUrl); // Log URL
      setIsEditing(false); // Reset editing state when a new PDF is uploaded
    }

    const reader = new FileReader()
    reader.onload = e => {
      setPdfFile(URL.createObjectURL(file));
    }

    
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    //console.log("PDF loaded with pages:", numPages);
    setNumPages(numPages);
    console.log(`Loaded a document with ${numPages} pages.`);
  };

  const addField = (type) => {
    setFormFields([...formFields, { type, value: '', x: 100, y: 100, id: Date.now() }]);
  };

  const handleDrag = (e, id) => {
    const field = formFields.find(f => f.id === id);
    const handleMouseMove = (e) => {
      const updatedFields = formFields.map(f =>
        f.id === id ? { ...field, x: e.clientX - 50, y: e.clientY - 20 } : f
      );
      setFormFields(updatedFields);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const saveModifiedPdf = async () => {
    try {
      const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Process each field
      for (const field of formFields) {
        if (field.type === 'text') {
          firstPage.drawText(field.value, {
            x: field.x,
            y: field.y,
            size: 12,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'checkbox') {
          firstPage.drawRectangle({
            x: field.x,
            y: field.y - 10,
            width: 10,
            height: 10,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'radio') {
          firstPage.drawEllipse({
            x: field.x,
            y: field.y,
            xScale: 10,
            yScale: 10,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'esign') {
          if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const pngImageBytes = sigCanvas.current.getTrimmedCanvas().toDataURL();
            const pngImage = await pdfDoc.embedPng(pngImageBytes);
            firstPage.drawImage(pngImage, { x: field.x, y: field.y, width: 100, height: 50 });
          } else {
            console.warn("Signature canvas is empty or not initialized");
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      download(pdfBytes, "modified.pdf", "application/pdf");
    } catch (error) {
      console.error('Error saving modified PDF:', error);
    }
  };

  const download = (data, fileName, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>PDF Editor</h1>
      {!pdfFile ? (
        <div>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        </div>
      ) : (
        <div>
          <button onClick={() => setIsEditing(true)}>Open PDF</button>
        </div>
      )}

      {isEditing && pdfFile &&  (
        <div >
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            { Array.from(new Array(numPages), (el, index) => (
              <Page key={index} pageNumber={index + 1} />
            ))}
          </Document>

          <div>
            <button onClick={() => addField('text')}>Add Text Field</button>
            <button onClick={() => addField('checkbox')}>Add Checkbox</button>
            <button onClick={() => addField('radio')}>Add Radio Button</button>
            <button onClick={() => addField('esign')}>Add E-Signature</button>
          </div>

          {formFields.map((field) => (
            <div
              key={field.id}
              style={{ position: 'absolute', top: field.y, left: field.x }}
              onMouseDown={(e) => handleDrag(e, field.id)}
            >
              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => {
                    const updatedFields = formFields.map(f =>
                      f.id === field.id ? { ...f, value: e.target.value } : f
                    );
                    setFormFields(updatedFields);
                  }}
                />
              )}
              {field.type === 'checkbox' && <input type="checkbox" />}
              {field.type === 'radio' && <input type="radio" />}
              {field.type === 'esign' && (
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ width: 300, height: 150, className: 'sigCanvas' }}
                />
              )}
            </div>
          ))}

          <button onClick={saveModifiedPdf}>Save Modified PDF</button>
        </div>
      )}
    </div>
  );
};

export default PdfEditor;

