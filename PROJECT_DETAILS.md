# Trading Journal Project Documentation

โปรเจกต์ Trading Journal สำหรับบันทึกและวิเคราะห์ข้อมูลการเทรด CFD พัฒนาด้วย Next.js 15 และ Tailwind CSS 4

## 🚀 ฟีเจอร์หลัก (Key Features)

### 1. ระบบจัดการข้อมูลเทรด (Full CRUD System)
- **Create**: บันทึกรายการเทรดใหม่ผ่าน Modal ที่สวยงาม
- **Read**: แสดงรายการเทรดในรูปแบบตาราง พร้อมสรุปสถิติ (Statistics Dashboard)
- **Update**: สามารถแก้ไขรายละเอียดรายการเทรดเดิมได้
- **Delete**: ลบรายการเทรดที่ไม่ต้องการพร้อมระบบยืนยัน
- **Persistence**: ข้อมูลถูกบันทึกแบบถาวรในไฟล์ Server-side JSON (`src/data/trades.json`)

### 2. ระบบแดชบอร์ดสถิติ (Statistics Dashboard)
- **Total Trades**: จำนวนรายการเทรดทั้งหมด
- **Win Rate**: อัตราการชนะ คำนวณจาก (Win / Closed Trades)
- **Net Profit**: กำไรสุทธิรวมทั้งหมด
- **Profit Factor**: คำนวณจาก (Gross Profit / Gross Loss) เพื่อวัดความได้เปรียบของกลยุทธ์

### 3. ระบบธีมและภาษา (Theme & Language Support)
- **Dark/Light Mode**: สลับโหมดมืดและสว่างได้ทันที และจดจำค่าที่เลือกไว้
- **Multi-language**: รองรับการสลับภาษา ไทย และ อังกฤษ (EN/TH) ครอบคลุมทั้ง UI และปุ่มสั่งงาน
- **Persistence**: ระบบจดจำการตั้งค่าธีมและภาษาผ่าน `localStorage`

## 🛠 ข้อมูลทางเทคนิค (Technical Details)

### การคำนวณสถิติ (Calculations)
- **Net PnL**: ระบบจะจัดการเครื่องหมาย +/- ให้อัตโนมัติในหน้าบันทึก (Win = บวก, Loss = ลบ)
- **Win Rate**: 
  - `wins.length / closedTrades.length * 100`
- **Profit Factor**: 
  - `GrossWins / GrossLosses` (คำนวณจากผลรวมกำไรบวก หารด้วย ผลรวมขาดทุนลบ)

### เทคโนโลยีที่ใช้ (Tech Stack)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4 (พร้อมระบบ @theme inline และ @custom-variant)
- **Icons**: Lucide React
- **State Management**: React Context API (Theme & Language)
- **Database**: JSON File System (Local Persistence)

## 📁 โครงสร้างโฟลเดอร์ที่สำคัญ
- `src/app/api`: ระบบ Backend สำหรับ CRUD ข้อมูล
- `src/components`: คอมโพเนนต์ UI เช่น `TradeModal`, `Sidebar`
- `src/context`: ระบบจัดการสถานะ Theme และ Language
- `src/data`: ที่เก็บข้อมูล JSON (เสมือนฐานข้อมูล)
- `src/lib`: ตัวช่วยจัดการไฟล์ (`db.ts`) และไฟล์แปลภาษา (`translations.ts`)
