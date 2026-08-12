'use client';
import {useParams} from 'next/navigation';
import {AdminShell} from '@/components/AdminShell';
import {ProductEditor} from '@/components/ProductEditor';
export default function EditProductPage(){const {id}=useParams<{id:string}>();return <AdminShell eyebrow="Store catalog" title="Edit Product"><ProductEditor productId={id}/></AdminShell>}