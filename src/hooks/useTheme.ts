import {useEffect,useState} from 'react';
export type Theme='system'|'light'|'dark';
const read=():Theme=>{const v=localStorage.getItem('hearmind-theme');return v==='light'||v==='dark'?v:'system'};
export function useTheme(){const [theme,setTheme]=useState<Theme>(read);useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const update=()=>document.documentElement.classList.toggle('dark',theme==='dark'||theme==='system'&&media.matches);update();media.addEventListener('change',update);localStorage.setItem('hearmind-theme',theme);return()=>media.removeEventListener('change',update)},[theme]);return {theme,setTheme}}
