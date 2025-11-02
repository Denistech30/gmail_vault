"use client"

import { useState } from "react"

export default function AccountCard({ account, onDelete }) {
  const [showPassword, setShowPassword] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <article>
      <div>
        <div>
          <div>
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3>{account.email}</h3>
            {account.recoveryEmail && (
              <p>Recovery email linked</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(account.id)}
          aria-label="Delete account"
        >
          <svg viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div>
        <div>
          <label>Password</label>
          <div>
            <code>{showPassword ? account.password : "••••••••"}</code>
            <button
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg viewBox="0 0 24 24" stroke="currentColor">
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                )}
              </svg>
            </button>
            <button
              onClick={() => copyToClipboard(account.password)}
              aria-label="Copy password"
            >
              <svg viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>

        {account.notes && (
          <div>
            <label>Notes</label>
            <p>{account.notes}</p>
          </div>
        )}

        {(account.recoveryEmail || account.recoveryPhone) && (
          <div>
            <label>Recovery Info</label>
            <div>
              {account.recoveryEmail && (
                <p>
                  <span>Email</span>
                  <span>{account.recoveryEmail}</span>
                </p>
              )}
              {account.recoveryPhone && (
                <p>
                  <span>Phone</span>
                  <span>{account.recoveryPhone}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
