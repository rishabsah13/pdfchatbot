import React, { useState } from "react";
import FileBase64 from "react-file-base64";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
  const [messages, setMessages] = useState([]);
  const [pdfContent, setPdfContent] = useState("");
  const [userInput, setUserInput] = useState("");

  const handleFileUpload = (file) => {
    const data = atob(file.base64.split(",")[1]);
    const pdfData = new Uint8Array(data.length);

    for (let i = 0; i < data.length; i++) {
      pdfData[i] = data.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
      let content = "";
      const pages = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push(
          pdf
            .getPage(i)
            .then((page) =>
              page.getTextContent().then((textContent) => {
                const pageText = textContent.items
                  .map((item) => item.str)
                  .join(" ");
                content += pageText + " ";
              })
            )
        );
      }

      Promise.all(pages).then(() => {
        setPdfContent(content);
        setMessages([
          ...messages,
          { user: true, text: "PDF uploaded successfully!" },
        ]);
      });
    });
  };

  const handleUserInput = () => {
    if (userInput.trim() === "") return;

    setMessages([...messages, { user: true, text: userInput }]);
    const response = generateAnswer(userInput, pdfContent);
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: false, text: response },
    ]);
    setUserInput("");
  };

  const generateAnswer = (query, pdfText) => {
    if (!pdfText) return "Please upload a PDF first.";

    const lowerCaseText = pdfText.toLowerCase();
    const lowerCaseQuery = query.toLowerCase();
    const matchIndex = lowerCaseText.indexOf(lowerCaseQuery);

    if (matchIndex !== -1) {
      const contextRadius = 500; // Increased context radius for more relevant text
      const start = Math.max(0, matchIndex - contextRadius);
      const end = Math.min(
        lowerCaseText.length,
        matchIndex + lowerCaseQuery.length + contextRadius
      );
      const matchText = pdfText.substring(start, end);

      return `I found a match in the document:\n\n...${matchText}...`;
    } else {
      return "I couldn't find anything related to that in the document.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white shadow-2xl rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          PDF Chatbot
        </h1>
        <FileBase64
          onDone={handleFileUpload}
          className="mb-6 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
        />
        <div className="h-64 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-3 ${
                message.user ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block rounded-lg px-4 py-2 ${
                  message.user
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask something..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-grow p-3 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleUserInput}
            className="bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
