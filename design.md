# Contract Portal — Design System

> Tham chiếu: [Vuexy — Cards Advance (Vertical Menu)](https://demos.pixinvent.com/vuexy-html-admin-template/html/vertical-menu-template/cards-advance.html)

Tài liệu này mô tả hệ thống thiết kế UI cho Contract Portal, lấy cảm hứng từ template **Vuexy Bootstrap Dashboard PRO** — layout vertical menu, stat cards, advance cards, bảng dữ liệu và header có actions.

---

## 1. Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|------------|--------|
| **Rõ ràng** | Thông tin quan trọng (trạng thái HĐ, ngày hết hạn, giá trị) nổi bật ngay trên dashboard |
| **Phân cấp** | Sidebar → Page header → Stat cards → Content cards → Tables |
| **Nhất quán** | Cùng bo góc, shadow, spacing trên mọi trang |
| **Hành động nhanh** | Nút primary rõ, filter/search luôn gần bảng dữ liệu |
| **Responsive** | Sidebar thu gọn desktop, drawer mobile |

---

## 2. Color Palette

### Primary (Vuexy Purple)

| Token | Hex | Tailwind gợi ý | Dùng cho |
|-------|-----|----------------|----------|
| `primary` | `#7367F0` | `violet-500` / custom | Nút chính, link, active menu |
| `primary-dark` | `#5E50EE` | `violet-600` | Hover button |
| `primary-light` | `#E9E7FD` | `violet-100` | Icon background stat card |

### Semantic

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `success` | `#28C76F` | Active, hoạt động |
| `warning` | `#FF9F43` | Pending, sắp hết hạn |
| `danger` | `#EA5455` | Expired, xóa, lỗi |
| `info` | `#00CFE8` | Thông báo, info |
| `secondary` | `#A8AAAE` | Text phụ, disabled |

### Neutral

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `body-bg` | `#F8F7FA` | Nền trang (Vuexy light bg) |
| `card-bg` | `#FFFFFF` | Nền card, header |
| `border` | `#DBDADE` | Viền card, table, input |
| `heading` | `#4B465C` | Tiêu đề |
| `body` | `#6F6B7D` | Nội dung phụ |
| `muted` | `#A5A3AE` | Placeholder, caption |

### Sidebar (Dark — Vertical Menu)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `sidebar-bg` | `#2F3349` | Nền sidebar |
| `sidebar-active` | `#7367F0` | Menu item active |
| `sidebar-text` | `#CFD3EC` | Label menu |
| `sidebar-muted` | `#7983BB` | Subtitle user |

---

## 3. Typography

**Font family:** `Public Sans`, fallback `Inter`, `system-ui`, `sans-serif`

| Level | Size | Weight | Line height | Dùng cho |
|-------|------|--------|-------------|----------|
| H1 | 28px | 600 | 1.2 | Page title |
| H2 | 22px | 600 | 1.3 | Card title |
| H3 | 18px | 600 | 1.4 | Section trong card |
| Body | 15px | 400 | 1.5 | Nội dung chung |
| Small | 13px | 400 | 1.5 | Label, table header |
| Caption | 12px | 400 | 1.4 | Badge, meta info |
| Stat value | 28px | 700 | 1.1 | Số liệu dashboard |

```css
/* Gợi ý thêm vào index.css */
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
```

---

## 4. Layout — Vertical Menu

```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR (260px)  │  TOPBAR (navbar content)             │
│ Logo + User      │  Toggle │ Page title │ User / Bell   │
│ ─────────────    ├──────────────────────────────────────┤
│ Dashboard        │                                      │
│ Hợp đồng         │  PAGE CONTENT                        │
│ Khách hàng       │  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ Thông báo        │  │Stat│ │Stat│ │Stat│ │Stat│        │
│ Admin            │  └────┘ └────┘ └────┘ └────┘        │
│                  │  ┌──────────────────────────────┐   │
│ ─────────────    │  │ Advance Card (table/list)    │   │
│ Đăng xuất        │  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

| Thuộc tính | Giá trị |
|------------|---------|
| Sidebar width (expanded) | `260px` |
| Sidebar width (collapsed) | `72px` |
| Topbar height | `64px` |
| Content padding | `24px` (desktop), `16px` (mobile) |
| Content max-width | Full fluid (Vuexy container-fluid) |

---

## 5. Components

### 5.1 Stat Card (Statistics)

Kiểu Vuexy *Cards → Statistics* — icon trái, số lớn, label nhỏ.

```
┌─────────────────────────────┐
│  [icon]   Tổng hợp đồng     │
│           128               │
└─────────────────────────────┘
```

| Thuộc tính | Giá trị |
|------------|---------|
| Background | `#FFFFFF` |
| Border radius | `10px` |
| Shadow | `0 2px 6px rgba(47,43,61,0.08)` |
| Padding | `24px` |
| Icon box | `42×42px`, radius `8px`, bg semantic-light |

**Contract Portal mapping:**

| Card | Icon color | Semantic |
|------|------------|----------|
| Tổng hợp đồng | Primary light | `primary` |
| Đang hoạt động | Success light | `success` |
| Đã hết hạn | Danger light | `danger` |
| Tổng giá trị | Warning light | `warning` |

### 5.2 Advance Card

Kiểu Vuexy *Cards → Advance* — card có header riêng, actions góc phải.

```
┌──────────────────────────────────────────────┐
│ Sắp hết hạn (30 ngày)     [Refresh] [View]  │  ← card-header
├──────────────────────────────────────────────┤
│  Table / List content                        │  ← card-body
└──────────────────────────────────────────────┘
```

| Phần | Style |
|------|-------|
| Header | `padding: 20px 24px`, border-bottom `1px solid #DBDADE` |
| Title | H2, `#4B465C` |
| Subtitle | Small, `#A5A3AE` |
| Actions | Icon buttons: Refresh, Download, View All |
| Body | `padding: 0` (table full bleed) hoặc `24px` (list) |

**Áp dụng:** Dashboard “Sắp hết hạn”, Contracts list, Customers list, Admin users.

### 5.3 Sidebar Menu Item

| State | Style |
|-------|-------|
| Default | Text `#CFD3EC`, padding `10px 16px`, radius `6px` |
| Hover | Background `rgba(255,255,255,0.06)` |
| Active | Background `#7367F0`, text `#FFFFFF`, icon filled |

### 5.4 Topbar / Navbar

- Nền trắng, shadow nhẹ `0 1px 0 #DBDADE`
- Bên trái: toggle sidebar + breadcrumb / page title
- Bên phải: notification bell (badge đỏ), avatar + dropdown user

### 5.5 Buttons

| Variant | Background | Text | Border radius |
|---------|------------|------|---------------|
| Primary | `#7367F0` | White | `6px` |
| Secondary | Transparent | `#7367F0` | `6px`, border primary |
| Success | `#28C76F` | White | `6px` |
| Danger | `#EA5455` | White | `6px` |
| Label | — | — | Padding `10px 20px`, font 15px weight 500 |

### 5.6 Form Inputs

| Thuộc tính | Giá trị |
|------------|---------|
| Height | `40px` |
| Border | `1px solid #DBDADE` |
| Radius | `6px` |
| Focus | Border `#7367F0`, ring `0 0 0 3px rgba(115,103,240,0.1)` |
| Label | 13px, weight 500, `#4B465C`, margin-bottom `6px` |

### 5.7 Table (Datatable style)

| Phần | Style |
|------|-------|
| Header row | Background `#F8F7FA`, text `#6F6B7D`, uppercase optional, 13px |
| Row hover | Background `#F8F7FA` |
| Cell padding | `12px 24px` |
| Border | Bottom `1px solid #DBDADE` |

### 5.8 Badges / Status

| Status | Background | Text |
|--------|------------|------|
| Draft | `#F1F0F2` | `#6F6B7D` |
| Pending | `#FFF0E1` | `#FF9F43` |
| Active | `#E8F8EF` | `#28C76F` |
| Expired | `#FCEAEA` | `#EA5455` |
| Terminated | `#F1F0F2` | `#A8AAAE` |

| Role | Background | Text |
|------|------------|------|
| Admin | `#E9E7FD` | `#7367F0` |
| Manager | `#E0F9FC` | `#00CFE8` |
| Staff | `#E8F8EF` | `#28C76F` |
| Client | `#F1F0F2` | `#6F6B7D` |

### 5.9 Modal

- Overlay: `rgba(47,43,61,0.5)`
- Card: white, radius `10px`, shadow `0 5px 20px rgba(47,43,61,0.15)`
- Header: title H2 + close icon
- Footer: buttons right-aligned (Cancel secondary, Submit primary)

### 5.10 Auth Pages (Login / Register)

Theo Vuexy *Authentication → Cover*:

- Split layout: trái illustration/brand, phải form
- Hoặc centered card trên nền gradient primary (`#7367F0` → `#5E50EE`)
- Logo + title + subtitle
- Form trong card trắng, shadow lớn

---

## 6. Spacing Scale

| Token | px | Dùng cho |
|-------|-----|----------|
| `xs` | 4 | Gap icon-text nhỏ |
| `sm` | 8 | Padding badge |
| `md` | 16 | Gap grid, mobile padding |
| `lg` | 24 | Card padding, content padding |
| `xl` | 32 | Section gap |
| `2xl` | 48 | Page section spacing |

---

## 7. Shadow & Radius

```css
--shadow-card: 0 2px 6px rgba(47, 43, 61, 0.08);
--shadow-dropdown: 0 4px 16px rgba(47, 43, 61, 0.12);
--shadow-modal: 0 5px 20px rgba(47, 43, 61, 0.15);

--radius-sm: 6px;   /* button, input, menu item */
--radius-md: 10px;  /* card */
--radius-lg: 12px;  /* modal, auth card */
--radius-full: 9999px; /* badge, avatar */
```

---

## 8. Iconography

- **Library:** [Lucide React](https://lucide.dev) (thay Tabler Icons của Vuexy)
- **Size:** 18px menu, 20px header actions, 22–24px stat card
- **Stroke:** 1.75px (mặc định Lucide)

| Menu | Icon Lucide |
|------|-------------|
| Dashboard | `LayoutDashboard` |
| Hợp đồng | `FileText` |
| Khách hàng | `Users` |
| Thông báo | `Bell` |
| Admin | `Shield` |

---

## 9. Page Mapping

### Dashboard `/`
- 4× Stat Card (grid `xl:grid-cols-4`)
- 1× Advance Card: “Sắp hết hạn” + table
- Optional: mini chart / progress card (phase 2)

### Hợp đồng `/contracts`
- Page header + nút “Tạo hợp đồng” primary
- Filter bar (search + status select)
- Advance Card chứa table

### Khách hàng `/customers`
- Tương tự Contracts

### Chi tiết HĐ `/contracts/:id`
- Hero card: số HĐ, title, status badge, meta grid
- Advance Card: Phụ lục list

### Admin `/admin`
- Advance Card: User management table + role select inline

### Login `/login`
- Cover style, redirect admin → `/admin`

---

## 10. Tailwind Theme Extension

Gợi ý thêm vào `index.css` hoặc `@theme` Tailwind v4:

```css
@import "tailwindcss";

@theme {
  --color-primary: #7367F0;
  --color-primary-dark: #5E50EE;
  --color-primary-light: #E9E7FD;
  --color-success: #28C76F;
  --color-warning: #FF9F43;
  --color-danger: #EA5455;
  --color-info: #00CFE8;
  --color-body-bg: #F8F7FA;
  --color-heading: #4B465C;
  --color-body: #6F6B7D;
  --color-border: #DBDADE;
  --color-sidebar: #2F3349;
  --font-sans: "Public Sans", Inter, system-ui, sans-serif;
  --shadow-card: 0 2px 6px rgba(47, 43, 61, 0.08);
  --radius-card: 10px;
}

body {
  @apply bg-[#F8F7FA] text-[#6F6B7D] antialiased;
  font-family: var(--font-sans);
}
```

---

## 11. Component Classes (Utility)

```html
<!-- Stat Card -->
<div class="rounded-[10px] bg-white p-6 shadow-[var(--shadow-card)]">...</div>

<!-- Advance Card -->
<div class="overflow-hidden rounded-[10px] bg-white shadow-[var(--shadow-card)]">
  <div class="flex items-center justify-between border-b border-[#DBDADE] px-6 py-5">...</div>
  <div>...</div>
</div>

<!-- Primary Button -->
<button class="rounded-md bg-[#7367F0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5E50EE]">
  Tạo hợp đồng
</button>

<!-- Active Nav -->
<a class="rounded-md bg-[#7367F0] px-4 py-2.5 text-sm text-white">Dashboard</a>
```

---

## 12. Dark Mode (Phase 2)

Vuexy hỗ trợ Light / Dark / System. Quy ước dự phòng:

| Token | Light | Dark |
|-------|-------|------|
| body-bg | `#F8F7FA` | `#25293C` |
| card-bg | `#FFFFFF` | `#2F3349` |
| heading | `#4B465C` | `#CFD3EC` |
| border | `#DBDADE` | `#434968` |

---

## 13. Checklist triển khai UI

- [x] Đổi primary từ indigo → `#7367F0` (Vuexy purple)
- [x] Sidebar `#2F3349`, active item primary
- [x] Body background `#F8F7FA`
- [x] Stat cards + advance cards trên Dashboard
- [x] Table style thống nhất (header `#F8F7FA`)
- [x] Badge colors theo bảng status/role
- [x] Font Public Sans
- [x] Auth page cover/gradient style
- [x] Topbar: notification + user dropdown

---

## 14. Tài liệu tham khảo

- [Vuexy — Cards Advance](https://demos.pixinvent.com/vuexy-html-admin-template/html/vertical-menu-template/cards-advance.html)
- [Vuexy — Cards Statistics](https://demos.pixinvent.com/vuexy-html-admin-template/html/vertical-menu-template/cards-statistics.html)
- [Lucide Icons](https://lucide.dev)
