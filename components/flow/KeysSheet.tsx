import { IconX } from "./Icons";

type KeysSheetProps = {
  onClose: () => void;
};

export function KeysSheet({
  onClose,
}: KeysSheetProps) {
  return (
    <div className="f-scrim" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={onClose}>
      <div className="f-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="f-sheet-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="f-btn icon ghost" onClick={onClose} aria-label="Close">
            <IconX size={15} />
          </button>
        </div>
        <div className="f-sheet-body">
          <div className="f-keys">
            {[
              ["Space", "Start / pause the speech clock"],
              ["← →", "Previous / next speech"],
              ["+ −", "Add or remove 30 seconds"],
              ["R", "Reset the current speech clock"],
              ["G", "New Government argument"],
              ["O", "New Opposition argument"],
              ["N", "Jump to this speech's notes"],
              ["C", "Jump to clashes & weighing"],
              ["P", "Log a taken POI"],
              ["⇧P", "Log a declined POI"],
              ["E", "Copy the whole flow"],
              ["T", "Toggle light / dark"],
              ["Esc", "Close this, or leave a field"],
            ].map(([key, label]) => (
              <div className="f-key-row" key={key}>
                <span>{label}</span>
                <kbd className="f-kbd">{key}</kbd>
              </div>
            ))}
          </div>
          <div className="f-field">
            <span>Inside an argument or clash</span>
            <div className="f-keys">
              {[
                ["⏎", "New line at the same level"],
                ["⇥", "Indent — becomes a reply to the line above"],
                ["⇧⇥", "Outdent one level"],
                ["⌫", "Delete an empty line"],
              ].map(([key, label]) => (
                <div className="f-key-row" key={key}>
                  <span>{label}</span>
                  <kbd className="f-kbd">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
          <p className="f-sheet-note">
            Replies alternate sides automatically, so an indented line under a GOV point is tagged OPP.
            Click any side tag to override it. Everything is stored in this browser only — nothing leaves the device.
          </p>
        </div>
      </div>
    </div>
  );
}
