export interface MenuItem {
  label: string;
  link: string;
  permission?: string; // 🔥 opcional
}

export interface MenuGroup {
  title: string;
  icon: string;
  children: MenuItem[];
}
