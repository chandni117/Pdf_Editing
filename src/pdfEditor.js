import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas';
import './PdfEditor.css';

const PdfEditor = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [formFields, setFormFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState(null);
  const sigCanvas = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedFields = localStorage.getItem('formFields');
    if (savedFields) {
      setFormFields(JSON.parse(savedFields));
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      setPdfFile(fileUrl);
      setNumPages(0);
      setIsEditing(false);
    } else {
      console.error("Selected file is not a valid PDF.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleClick = (e) => {
    if (selectedFieldType) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pageIndex = Math.floor(y / (rect.height / numPages));
      addField(selectedFieldType, x, y, pageIndex + 1);
    }
  };

  const addField = (type, x = 100, y = 100, pageNumber = 1) => {
    if (numPages > 0 && selectedFieldType) {
      const newField = { type, value: '', x, y, id: Date.now(), pageNumber };
      const updatedFields = [...formFields, newField];
      setFormFields(updatedFields);
      setSelectedFieldType(null);
      localStorage.setItem('formFields', JSON.stringify(updatedFields));
    }
  };

  const saveModifiedPdf = async () => {
    try {
      const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      for (const field of formFields) {
        const pageNumber = field.pageNumber - 1;
        if (pageNumber >= pdfDoc.getPageCount() || pageNumber < 0) continue;

        const page = pdfDoc.getPage(pageNumber);
        const pdfHeight = page.getHeight();

        if (field.type === 'text') {
          page.drawText(field.value, {
            x: field.x,
            y: pdfHeight - field.y - 12,
            size: 12,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'checkbox') {
          page.drawRectangle({
            x: field.x,
            y: pdfHeight - field.y - 10,
            width: 10,
            height: 10,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'radio') {
          page.drawEllipse({
            x: field.x,
            y: pdfHeight - field.y,
            xScale: 10,
            yScale: 10,
            color: rgb(0, 0, 0),
          });
        } else if (field.type === 'esign') {
          if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const pngImageBytes = sigCanvas.current.getTrimmedCanvas().toDataURL();
            const pngImage = await pdfDoc.embedPng(pngImageBytes);
            page.drawImage(pngImage, { x: field.x, y: pdfHeight - field.y - 50, width: 100, height: 50 });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      download(pdfBytes, "modified.pdf", "application/pdf");

      // Clear pdfFile and file input to allow re-uploading
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
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
          <input type="file" accept="application/pdf" onChange={handleFileUpload} ref={fileInputRef} />
        </div>
      ) : (
        <div>
          <button onClick={() => setIsEditing(true)}>Open PDF</button>
        </div>
      )}

      {isEditing && pdfFile && (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }} onClick={handleClick}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("Error loading PDF:", error)}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={index} pageNumber={index + 1} />
            ))}
          </Document>

          <div>
            <button onClick={() => setSelectedFieldType('text')}>Add Text Field</button>
            <button onClick={() => setSelectedFieldType('checkbox')}>Add Checkbox</button>
            <button onClick={() => setSelectedFieldType('radio')}>Add Radio Button</button>
            <button onClick={() => setSelectedFieldType('esign')}>Add E-Signature</button>
          </div>

          {formFields.map((field) => (
            <div
              key={field.id}
              style={{ position: 'absolute', top: field.y, left: field.x, cursor: 'move' }}
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
                    localStorage.setItem('formFields', JSON.stringify(updatedFields));
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
