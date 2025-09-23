import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Transition.Root as={Fragment} show={open}>
      <Dialog as="div" onClose={onClose}>
        <Transition.Child as={Fragment}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
        </Transition.Child>
        <div style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Transition.Child as={Fragment}>
              <Dialog.Panel
                style={{
                  width: '100%',
                  maxWidth: 640,
                  borderRadius: 12,
                  background: '#111827',
                  color: '#e5e5e5',
                  border: '1px solid #374151',
                  padding: 16,
                }}
              >
                <Dialog.Title style={{ fontSize: 18, fontWeight: 600 }}>About Digital Embryo Explorable</Dialog.Title>
                <div style={{ marginTop: 8, fontSize: 14, color: '#d1d5db' }}>
                  <p>
                    This MVP demonstrates early human embryo development from zygote to blastocyst, with simplified gene expression and perturbation effects for teaching.
                  </p>
                  <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                    <li>3D rendering via three.js + react-three-fiber</li>
                    <li>Data driven by static JSON</li>
                    <li>Perturbations are illustrative, hard-coded scenarios</li>
                  </ul>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 500 }}>Data sources</div>
                    <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                      <li>Petropoulos et al., Cell (2016): simplified lineage markers and stages used for teaching visualization.</li>
                      <li>Wang et al., Nat Cell Biol (2024): illustrative perturbation motifs (AURKA, metabolism).</li>
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 8, background: '#111827', color: '#e5e5e5', border: '1px solid #374151' }}>
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default AboutModal
