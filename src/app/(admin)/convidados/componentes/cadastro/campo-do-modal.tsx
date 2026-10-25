import { Entrada } from "@/components/ui/input";

interface PropriedadesDoCampo {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}

export function CampoDoModalDoConvidado({ label: text, name, type = "text", placeholder, defaultValue, required, hint: help, inputMode, autoComplete }: PropriedadesDoCampo) {
  return (
    <Entrada
      label={
        required ? (
          <>
            {text}{" "}
            <span className="text-perigo" aria-hidden="true">
              *
            </span>
          </>
        ) : (
          text
        )
      }
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      inputMode={inputMode}
      autoComplete={autoComplete}
      hint={help}
    />
  );
}
