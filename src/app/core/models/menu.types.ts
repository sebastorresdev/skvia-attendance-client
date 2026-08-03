export interface MenuItem {
  label: string;
  link: string;
  permission?: string; // 🔥 opcional
  target?: string;
}

export interface MenuGroup {
  title: string;
  icon: string;
  children: MenuItem[];
}
