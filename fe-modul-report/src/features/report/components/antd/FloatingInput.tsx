import { Input } from "antd";

interface Props {
  label: string;
  value?: any;
  onChange?: any;
}

export default function FloatingInput({ label, value, onChange }: Props) {
  return (
    <div className="relative w-full mb-5">
      <Input
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer py-3"
      />

      <label
        className="
          absolute left-3 top-2 text-gray-500 pointer-events-none 
          transition-all 
          peer-placeholder-shown:top-3 
          peer-placeholder-shown:text-base 
          peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-500
          peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs
        "
      >
        {label}
      </label>
    </div>
  );
}
