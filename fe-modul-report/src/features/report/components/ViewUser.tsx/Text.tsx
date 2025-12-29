import React, { useEffect, useState, useRef } from "react";
import type { Text } from "../../types/report";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";

interface TextProps {
  text: Text;
  editMode?: boolean;
  onChange?: (updated: Text) => void;
}

// Font map giống backend resolveFontFile
const FONT_FAMILIES = ["Arial", "Times", "Tahoma", "Calibri", "Verdana", "Georgia"];

const normalizeFont = (fontName: string) => {
  if (!fontName) return "Times";
  fontName = fontName.toLowerCase();
  if (fontName.includes("arial")) return "Arial";
  if (fontName.includes("times")) return "Times";
  if (fontName.includes("tahoma")) return "Tahoma";
  if (fontName.includes("calibri")) return "Calibri";
  if (fontName.includes("verdana")) return "Verdana";
  if (fontName.includes("georgia")) return "Georgia";
  return "Times";
};

const TextComponent: React.FC<TextProps> = ({ text, editMode = false, onChange }) => {
  // State nội bộ
  const [content, setContent] = useState(text.content);
  const [fontName, setFontName] = useState(normalizeFont(text.fontName));
  const [fontSize, setFontSize] = useState(text.fontSize);
  const [fontStyle, setFontStyle] = useState<string[]>(text.fontStyle ?? []);
  const [align, setAlign] = useState<Text["align"]>(text.align);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Khi text mới (id khác) => reset state
  useEffect(() => {
    setContent(text.content);
    setFontName(normalizeFont(text.fontName));
    setFontSize(text.fontSize);
    setFontStyle(text.fontStyle ?? []);
    setAlign(text.align);
  }, [text.id]);

  // Hàm gọi onChange
  const handleChange = (updated: Partial<Text>) => {
    onChange?.({
      ...text,
      content,
      fontName,
      fontSize,
      fontStyle,
      align,
      ...updated,
    });
  };

  const toggleStyle = (style: "bold" | "italic" | "underline") => {
    const updated = fontStyle.includes(style)
      ? fontStyle.filter(s => s !== style)
      : [...fontStyle, style];
    setFontStyle(updated);
    handleChange({ fontStyle: updated });
  };

  const changeAlign = (a: Text["align"]) => {
    setAlign(a);
    handleChange({ align: a });
  };

  // Tự động điều chỉnh height của textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "0px"; // reset
      const maxHeight = 400; // tối đa
      ta.style.height = Math.min(ta.scrollHeight, maxHeight) + "px";
    }
  }, [content, fontSize]);

  if (!editMode) {
    return (
      <p
        className="whitespace-pre-wrap"
        style={{
          fontFamily: fontName,
          fontSize,
          fontWeight: fontStyle.includes("bold") ? "bold" : "normal",
          fontStyle: fontStyle.includes("italic") ? "italic" : "normal",
          textDecoration: fontStyle.includes("underline") ? "underline" : "none",
          textAlign: align,
        }}
      >
        {content}
      </p>
    );
  }

  return (
    <div className="p-2 bg-gray-50 rounded">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select
          value={fontName}
          onChange={e => {
            const f = normalizeFont(e.target.value);
            setFontName(f);
            handleChange({ fontName: f });
          }}
          className="border rounded px-2 py-1"
        >
          {FONT_FAMILIES.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          type="number"
          value={fontSize}
          onChange={e => {
            const size = Number(e.target.value);
            setFontSize(size);
            handleChange({ fontSize: size });
          }}
          className="border rounded px-2 py-1 w-20"
          min={8} max={72}
        />
        <span>px</span>

        <button
          className={`px-2 py-1 border rounded ${fontStyle.includes("bold") ? "bg-gray-300" : ""}`}
          onClick={() => toggleStyle("bold")}
        ><FaBold /></button>
        <button
          className={`px-2 py-1 border rounded ${fontStyle.includes("italic") ? "bg-gray-300" : ""}`}
          onClick={() => toggleStyle("italic")}
        ><FaItalic /></button>
        <button
          className={`px-2 py-1 border rounded ${fontStyle.includes("underline") ? "bg-gray-300" : ""}`}
          onClick={() => toggleStyle("underline")}
        ><FaUnderline /></button>

        <button
          className={`px-2 py-1 border rounded ${align === "left" ? "bg-gray-300" : ""}`}
          onClick={() => changeAlign("left")}
        ><FaAlignLeft /></button>
        <button
          className={`px-2 py-1 border rounded ${align === "center" ? "bg-gray-300" : ""}`}
          onClick={() => changeAlign("center")}
        ><FaAlignCenter /></button>
        <button
          className={`px-2 py-1 border rounded ${align === "right" ? "bg-gray-300" : ""}`}
          onClick={() => changeAlign("right")}
        ><FaAlignRight /></button>
      </div>

      {/* Textarea tự co giãn */}
      <textarea
        ref={textareaRef}
        className="w-full p-2 border outline-none  resize-none overflow-auto bg-gray-50"
        value={content}
        onChange={e => {
          setContent(e.target.value);
          handleChange({ content: e.target.value });
        }}
        style={{
          fontFamily: fontName,
          fontSize,
          fontWeight: fontStyle.includes("bold") ? "bold" : "normal",
          fontStyle: fontStyle.includes("italic") ? "italic" : "normal",
          textDecoration: fontStyle.includes("underline") ? "underline" : "none",
          textAlign: align,
          maxHeight: 400,
        }}
      />
    </div>
  );
};

export default TextComponent;
