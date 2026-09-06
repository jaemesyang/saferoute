import { QRCodeSVG } from 'qrcode.react'

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export default function QRCodeGenerator({ value, size = 220 }: QRCodeGeneratorProps) {
  return <QRCodeSVG value={value} size={size} marginSize={3} />
}
