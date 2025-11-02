"use client"

export default function Input({
  type = "text",
  name,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  secure = false,
  className = "",
}) {
  return (
    <input
      type={type}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoComplete={secure ? "off" : undefined}
      className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
    />
  )
}
