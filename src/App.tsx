import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, DragEvent, ReactNode } from "react"

type Screen = "files" | "sent"

type SentFile = {
  id: number
  name: string
  recipient: string
  date: string
}

type Contact = {
  name: string
  email: string
  role: string
}

const MAX_FILE_SIZE = 500 * 1024 * 1024
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".md"]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Données de démonstration : à remplacer par l'annuaire de l'entreprise.
const contacts: Contact[] = [
  { name: "Mme Lefèvre", email: "lefevre@entreprise.com", role: "Direction financière" },
  { name: "M. Diallo", email: "diallo@entreprise.com", role: "Achats" },
  { name: "Directeur", email: "directeur@test.com", role: "Direction" },
  { name: "Étudiant", email: "etudiant@gmail.com", role: "Externe" },
]

const initialSentFiles: SentFile[] = [
  { id: 1, name: "fichier.pdf", recipient: "directeur@test.com", date: "10/01/2026" },
  { id: 2, name: "CIP.pdf", recipient: "etudiant@gmail.com", date: "06/09/2026" },
]

function labelFor(email: string) {
  return contacts.find((contact) => contact.email === email)?.name ?? email
}

function typeLabel(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase()
  if (extension === "pdf") return "Document PDF"
  if (extension === "doc" || extension === "docx") return "Document Word"
  if (extension === "xls" || extension === "xlsx") return "Feuille Excel"
  if (extension === "md") return "Document Markdown"
  return "Document"
}

function validateFile(file: File): string | null {
  const extension = "." + (file.name.split(".").pop() ?? "").toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return "Ce type de fichier n’est pas accepté. Choisissez un PDF, un document Word, une feuille Excel ou un fichier Markdown."
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ce fichier dépasse 500 Mo. Choisissez un fichier plus léger."
  }
  return null
}

/* ---------- Icônes vectorielles SafeVault (viewBox 64 x 64) ---------- */

// Cadenas : l'anse est dessinée avec des courbes de Bézier cubiques,
// le trou de serrure est percé par la règle de remplissage pair-impair.
const LOCK_SHACKLE =
  "M22 28 V20 C22 12.5 26.5 8 32 8 C37.5 8 42 12.5 42 20 V28 H36 V20 C36 16.5 34.5 14 32 14 C29.5 14 28 16.5 28 20 V28 Z"
const LOCK_BODY =
  "M20 28 H44 A6 6 0 0 1 50 34 V48 A6 6 0 0 1 44 54 H20 A6 6 0 0 1 14 48 V34 A6 6 0 0 1 20 28 Z M32 35 A4 4 0 0 1 34 42.4 V47 H30 V42.4 A4 4 0 0 1 32 35 Z"

type StrokeIconName = "archive" | "check" | "search" | "trash" | "upload" | "user"
type FilledIconName = "file" | "lock" | "share"
type IconName = StrokeIconName | FilledIconName

const strokeIcons: Record<StrokeIconName, ReactNode> = {
  archive: (
    <>
      <path d="M4 7h16" />
      <path d="M5 7v12h14V7" />
      <path d="M3 3h18v4H3z" />
      <path d="M9 11h6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 15v5h14v-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

const filledIcons: Record<FilledIconName, ReactNode> = {
  lock: (
    <>
      <path d={LOCK_SHACKLE} />
      <path d={LOCK_BODY} fillRule="evenodd" />
    </>
  ),
  file: (
    <>
      <path
        d="M16 6 H38 L52 20 V54 A4 4 0 0 1 48 58 H16 A4 4 0 0 1 12 54 V10 A4 4 0 0 1 16 6 Z M20 32 H44 V36 H20 Z M20 42 H44 V46 H20 Z"
        fillRule="evenodd"
      />
      <path d="M38 6 L52 20 H42 A4 4 0 0 1 38 16 Z" fill="#fff" fillOpacity={0.45} />
    </>
  ),
  share: (
    <>
      <path
        d="M46 16 L18 32 L46 48"
        fill="none"
        style={{ stroke: "currentColor", strokeWidth: 4 }}
      />
      <circle cx="46" cy="16" r="8" />
      <circle cx="18" cy="32" r="8" />
      <circle cx="46" cy="48" r="8" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  if (name === "file" || name === "lock" || name === "share") {
    return (
      <svg
        aria-hidden="true"
        className="icon icon-filled"
        fill="currentColor"
        height={size}
        viewBox="0 0 64 64"
        width={size}
      >
        {filledIcons[name]}
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {strokeIcons[name]}
    </svg>
  )
}

// Cadenas animé : l'anse descend en 0,3 s pour confirmer que le fichier est prêt.
function LockMark({ locked, size = 30 }: { locked: boolean; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className={`lock-mark${locked ? " is-locked" : ""}`}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      <path className="lock-shackle" d={LOCK_SHACKLE} />
      <path d={LOCK_BODY} fillRule="evenodd" />
    </svg>
  )
}

// Anneau de progression : l'anneau se remplit, puis le cadenas se ferme à 100 %.
function ProgressRing({
  value,
  locked,
  size = 76,
  stroke = 6,
}: {
  value: number
  locked: boolean
  size?: number
  stroke?: number
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  return (
    <div
      aria-label="Téléversement du fichier"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className={`progress-ring${value >= 100 ? " complete" : ""}`}
      role="progressbar"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle className="ring-track" cx={center} cy={center} r={radius} strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={center}
          cy={center}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          strokeWidth={stroke}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="ring-center">
        {value >= 100 ? <LockMark locked={locked} size={34} /> : `${value} %`}
      </span>
    </div>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`
}

/* ---------- Composants ---------- */

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button
            autoFocus
            className="secondary-button"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button className="danger-button" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Header({
  screen,
  onNavigate,
}: {
  screen: Screen
  onNavigate: (screen: Screen) => void
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => onNavigate("files")}
          type="button"
        >
          <span className="brand-mark">
            <Icon name="lock" size={22} />
          </span>
          <span>SafeVault</span>
        </button>

        <nav aria-label="Navigation principale" className="main-nav">
          <button
            aria-current={screen === "files" ? "page" : undefined}
            className={screen === "files" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("files")}
            type="button"
          >
            <Icon name="file" size={18} />
            Fichiers
          </button>
          <button
            aria-current={screen === "sent" ? "page" : undefined}
            className={screen === "sent" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("sent")}
            type="button"
          >
            <Icon name="archive" size={18} />
            Envoyés
          </button>
        </nav>

        <div className="account">
          <span className="avatar">
            <Icon name="user" size={18} />
          </span>
          <span className="account-name">Karim</span>
          <span className="account-separator" />
          <button className="logout-button" type="button">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}

function UploadScreen({
  onSent,
}: {
  onSent: (file: File, recipients: string[]) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [locked, setLocked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [recipientInput, setRecipientInput] = useState("")
  const [recipientError, setRecipientError] = useState("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [confidential, setConfidential] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const uploading = file !== null && progress < 100
  const done = file !== null && progress >= 100

  // Téléversement simulé (pas de serveur dans le prototype) : la durée dépend
  // de la taille du fichier, entre 1,5 et 4 secondes, avec un ralenti final.
  useEffect(() => {
    if (!file) return undefined
    const duration = Math.min(4000, Math.max(1500, file.size / 20000))
    const start = performance.now()
    const timer = window.setInterval(() => {
      const ratio = Math.min(1, (performance.now() - start) / duration)
      setProgress(Math.round((1 - Math.pow(1 - ratio, 2)) * 100))
      if (ratio >= 1) window.clearInterval(timer)
    }, 80)
    return () => window.clearInterval(timer)
  }, [file])

  // Le cadenas se ferme quand le téléversement se termine.
  useEffect(() => {
    if (!done) {
      setLocked(false)
      return undefined
    }
    const timer = window.setTimeout(() => setLocked(true), 60)
    return () => window.clearTimeout(timer)
  }, [done])

  const term = recipientInput.trim().toLowerCase()
  const suggestions = term
    ? contacts
        .filter(
          (contact) =>
            !recipients.includes(contact.email) &&
            (contact.name.toLowerCase().includes(term) ||
              contact.email.includes(term)),
        )
        .slice(0, 4)
    : []

  const ready = done && recipients.length > 0
  const helper = !file
    ? recipients.length > 0
      ? "Ajoutez un fichier pour pouvoir envoyer."
      : "Ajoutez un fichier et un destinataire pour pouvoir envoyer."
    : uploading
      ? "Téléversement en cours : l’envoi sera possible dans un instant."
      : recipients.length === 0
        ? "Ajoutez un destinataire pour pouvoir envoyer."
        : `Vous allez envoyer « ${file.name} » à ${recipients.map(labelFor).join(", ")}.`

  function acceptFile(candidate: File | null | undefined) {
    if (!candidate) return
    const error = validateFile(candidate)
    setFileError(error ?? "")
    if (!error) {
      setProgress(0)
      setFile(candidate)
    }
  }

  function cancelUpload() {
    setFile(null)
    setProgress(0)
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0])
    event.target.value = ""
  }

  function dropFile(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    acceptFile(event.dataTransfer.files?.[0])
  }

  function addRecipient(chosenEmail?: string) {
    const typed = (chosenEmail ?? recipientInput).trim().toLowerCase()
    if (!typed) {
      setRecipientError("Saisissez un nom ou une adresse e-mail.")
      return
    }
    const email =
      chosenEmail ??
      (EMAIL_PATTERN.test(typed)
        ? typed
        : suggestions.length === 1
          ? suggestions[0].email
          : "")
    if (!email) {
      setRecipientError(
        suggestions.length > 1
          ? "Plusieurs personnes correspondent. Choisissez-en une dans la liste."
          : "Nous ne trouvons personne avec ce nom. Saisissez une adresse e-mail complète, par exemple nom@entreprise.com.",
      )
      return
    }
    if (recipients.includes(email)) {
      setRecipientError("Cette personne est déjà dans la liste.")
      return
    }
    setRecipients((current) => [...current, email])
    setRecipientInput("")
    setRecipientError("")
  }

  function resetForm() {
    setFile(null)
    setProgress(0)
    setFileError("")
    setRecipientInput("")
    setRecipientError("")
    setRecipients([])
    setConfidential(true)
    setConfirmCancel(false)
  }

  function requestCancel() {
    if (file || recipients.length > 0 || recipientInput) setConfirmCancel(true)
  }

  function send() {
    if (file && recipients.length > 0) onSent(file, recipients)
  }

  return (
    <main className="page upload-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">ENVOI SÉCURISÉ</div>
          <h1 className="page-title">Envoyer un fichier</h1>
          <div className="page-description">
            Partagez vos documents confidentiels en toute sécurité.
          </div>
        </div>
        <div className="security-status">
          <span className="status-icon">
            <Icon name="lock" size={16} />
          </span>
          Connexion sécurisée
        </div>
      </div>

      <section className="form-card" aria-label="Formulaire d’envoi sécurisé">
        <div className="form-step">
          <div className="step-number">1</div>
          <div>
            <h2 className="section-title">Choisissez votre fichier</h2>
            <div className="section-helper">
              Sélectionnez le document que vous souhaitez partager.
            </div>
          </div>
        </div>

        <input
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="visually-hidden"
          onChange={selectFile}
          ref={fileInput}
          tabIndex={-1}
          type="file"
        />
        {uploading && file ? (
          <div
            className="drop-zone uploading"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
          >
            <ProgressRing locked={false} value={progress} />
            <span className="drop-title">Téléversement de {file.name}</span>
            <span className="drop-caption">
              {progress} % · {formatSize(file.size)}
            </span>
            <button className="link-button" onClick={cancelUpload} type="button">
              Annuler le téléversement
            </button>
          </div>
        ) : (
          <button
            className={`drop-zone${isDragging ? " dragging" : ""}${
              file ? " has-file" : ""
            }`}
            onClick={() => fileInput.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false)
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={dropFile}
            type="button"
          >
            {done && !isDragging ? (
              <ProgressRing locked={locked} value={100} />
            ) : (
              <span className="upload-icon">
                <Icon name="upload" size={29} />
              </span>
            )}
            {isDragging ? (
              <>
                <span className="drop-title">Relâchez pour déposer</span>
                <span className="drop-caption">
                  Le fichier sera prêt à être envoyé.
                </span>
              </>
            ) : file ? (
              <>
                <span className="drop-title">{file.name}</span>
                <span className="drop-caption">
                  {formatSize(file.size)} · Prêt à être envoyé · Cliquez pour le remplacer
                </span>
              </>
            ) : (
              <>
                <span className="drop-title">
                  Glissez votre fichier ici ou <span>cliquez pour parcourir</span>
                </span>
                <span className="drop-caption">
                  Taille max. 500 Mo · PDF, Word, Excel, Markdown
                </span>
              </>
            )}
          </button>
        )}
        <p className="visually-hidden" role="status">
          {done && file ? `${file.name} est prêt à être envoyé.` : ""}
        </p>
        {fileError && (
          <p className="field-error" role="alert">
            {fileError}
          </p>
        )}

        <div className="divider" />

        <div className="recipient-heading">
          <div className="form-step compact">
            <div className="step-number">2</div>
            <div>
              <h2 className="section-title">Destinataire</h2>
              <div className="section-helper">
                Indiquez qui recevra ce document.
              </div>
            </div>
          </div>
          <div className="recipient-field">
            <div className="recipient-search">
              <Icon name="search" size={18} />
              <input
                aria-label="Nom ou adresse e-mail du destinataire"
                autoComplete="off"
                onChange={(event) => {
                  setRecipientInput(event.target.value)
                  setRecipientError("")
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addRecipient()
                  }
                }}
                placeholder="Nom ou adresse e-mail"
                type="text"
                value={recipientInput}
              />
              <button onClick={() => addRecipient()} type="button">
                Ajouter
              </button>
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestions" aria-label="Personnes correspondantes">
                {suggestions.map((contact) => (
                  <li key={contact.email}>
                    <button
                      onClick={() => addRecipient(contact.email)}
                      type="button"
                    >
                      <span className="suggestion-name">{contact.name}</span>
                      <span className="suggestion-detail">
                        {contact.email} · {contact.role}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {recipientError && (
          <p className="field-error" role="alert">
            {recipientError}
          </p>
        )}

        <div className="recipient-list" aria-label="Destinataires sélectionnés">
          <div className="recipient-label">
            {recipients.length > 1
              ? "DESTINATAIRES SÉLECTIONNÉS"
              : "DESTINATAIRE SÉLECTIONNÉ"}
          </div>
          {recipients.map((recipient) => (
            <div className="recipient-row" key={recipient}>
              <span className="recipient-avatar">
                {labelFor(recipient).slice(0, 1).toUpperCase()}
              </span>
              <span className="recipient-text">
                <span className="recipient-email">{labelFor(recipient)}</span>
                {labelFor(recipient) !== recipient && (
                  <span className="recipient-address">{recipient}</span>
                )}
              </span>
              <span className="selected-mark">
                <Icon name="check" size={16} />
              </span>
              <button
                aria-label={`Retirer ${recipient}`}
                className="remove-recipient"
                onClick={() =>
                  setRecipients((current) =>
                    current.filter((item) => item !== recipient),
                  )
                }
                type="button"
              >
                Retirer
              </button>
            </div>
          ))}
          {recipients.length === 0 && (
            <div className="empty-recipient">
              Aucun destinataire sélectionné pour le moment.
            </div>
          )}
        </div>

        <label className="confidential-option">
          <input
            checked={confidential}
            onChange={(event) => setConfidential(event.target.checked)}
            type="checkbox"
          />
          <span className="custom-checkbox">
            {confidential && <Icon name="check" size={15} />}
          </span>
          <span className="confidential-icon">
            <Icon name="lock" size={18} />
          </span>
          <span>
            <strong>Document confidentiel</strong>
            <small>
              {confidential ? "Chiffrement activé" : "Chiffrement désactivé"}
            </small>
          </span>
          {confidential && <span className="encryption-badge">AES-256</span>}
        </label>
        {!confidential && (
          <p className="field-warning">
            Sans cette option, le document ne sera pas chiffré pendant l’envoi.
          </p>
        )}

        <div className="form-footer">
          <p
            aria-live="polite"
            className={ready ? "helper ready" : "helper"}
            id="send-helper"
          >
            {helper}
          </p>
          <div className="form-actions">
            <button
              className="cancel-button"
              onClick={requestCancel}
              type="button"
            >
              Annuler
            </button>
            <button
              aria-describedby="send-helper"
              className="primary-button"
              disabled={!ready}
              onClick={send}
              type="button"
            >
              <Icon name="share" size={19} />
              Envoyer de façon sécurisée
            </button>
          </div>
        </div>
      </section>
      <div className="trust-note">
        <Icon name="lock" size={14} />
        Vos fichiers sont chiffrés pendant le transfert et ne sont accessibles
        qu’au destinataire.
      </div>

      {confirmCancel && (
        <ConfirmDialog
          cancelLabel="Revenir à l’envoi"
          confirmLabel="Effacer le formulaire"
          message="Le fichier et les destinataires choisis seront retirés."
          onCancel={() => setConfirmCancel(false)}
          onConfirm={resetForm}
          title="Annuler cet envoi ?"
        />
      )}
    </main>
  )
}

function SentScreen({
  files,
  notice,
  onDismissNotice,
  onDelete,
}: {
  files: SentFile[]
  notice: string
  onDismissNotice: () => void
  onDelete: (id: number) => void
}) {
  const [search, setSearch] = useState("")
  const [toDelete, setToDelete] = useState<SentFile | null>(null)
  const term = search.toLowerCase()
  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(term) ||
      file.recipient.toLowerCase().includes(term) ||
      file.date.includes(term),
  )

  return (
    <main className="page sent-page">
      {notice && (
        <div className="notice" role="status">
          <span className="notice-icon">
            <Icon name="share" size={18} />
          </span>
          <span className="notice-text">{notice}</span>
          <button onClick={onDismissNotice} type="button">
            Fermer
          </button>
        </div>
      )}

      <div className="page-intro">
        <div>
          <div className="eyebrow">HISTORIQUE</div>
          <h1 className="page-title">Fichiers envoyés</h1>
          <div className="page-description">
            Retrouvez les documents que vous avez partagés.
          </div>
        </div>
      </div>

      <div className="history-card">
        <div className="history-toolbar">
          <div className="wide-search">
            <input
              aria-label="Rechercher dans les fichiers envoyés"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un fichier, un destinataire ou une date"
              type="search"
              value={search}
            />
            <Icon name="search" size={20} />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Destinataire</th>
                <th>Date d’envoi</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <div className="file-cell">
                      <span className="file-type-icon">
                        <Icon name="file" size={20} />
                      </span>
                      <span>
                        <strong>{file.name}</strong>
                        <small>{typeLabel(file.name)}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="recipient-table-cell">
                      <span className="table-avatar">
                        {labelFor(file.recipient).slice(0, 1).toUpperCase()}
                      </span>
                      {file.recipient}
                    </div>
                  </td>
                  <td>{file.date}</td>
                  <td>
                    <span className="sent-badge">
                      <Icon name="check" size={14} />
                      Envoyé
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`Supprimer ${file.name} envoyé à ${file.recipient}`}
                      className="delete-button"
                      onClick={() => setToDelete(file)}
                      type="button"
                    >
                      <Icon name="trash" size={16} />
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFiles.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan={5}>
                    Aucun fichier ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          {filteredFiles.length} fichier{filteredFiles.length > 1 ? "s" : ""}{" "}
          envoyé{filteredFiles.length > 1 ? "s" : ""}
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog
          cancelLabel="Annuler"
          confirmLabel="Supprimer"
          message="Cette action est définitive : l’envoi ne figurera plus dans votre historique."
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            onDelete(toDelete.id)
            setToDelete(null)
          }}
          title={`Supprimer « ${toDelete.name} » ?`}
        />
      )}
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("files")
  const [sentFiles, setSentFiles] = useState<SentFile[]>(initialSentFiles)
  const [notice, setNotice] = useState("")

  function navigate(next: Screen) {
    setScreen(next)
    setNotice("")
  }

  function handleSent(file: File, recipients: string[]) {
    const date = new Date().toLocaleDateString("fr-FR")
    setSentFiles((current) => {
      const firstId = Math.max(0, ...current.map((item) => item.id)) + 1
      const added = recipients.map((recipient, index) => ({
        id: firstId + index,
        name: file.name,
        recipient,
        date,
      }))
      return [...added, ...current]
    })
    setNotice(
      `« ${file.name} » a bien été envoyé à ${recipients
        .map(labelFor)
        .join(", ")}. Le destinataire recevra un lien sécurisé par e-mail.`,
    )
    setScreen("sent")
  }

  return (
    <div className="app-shell">
      <Header onNavigate={navigate} screen={screen} />
      {screen === "files" ? (
        <UploadScreen onSent={handleSent} />
      ) : (
        <SentScreen
          files={sentFiles}
          notice={notice}
          onDelete={(id) =>
            setSentFiles((current) => current.filter((file) => file.id !== id))
          }
          onDismissNotice={() => setNotice("")}
        />
      )}
    </div>
  )
}