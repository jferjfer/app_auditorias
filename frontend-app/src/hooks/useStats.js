import { useState, useEffect, useRef } from 'react'
import { fetchStats } from '../services/api'

export default function useStats(initialFilters = {}){
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    // debounce calls to avoid rapid reloads
    if(debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadStats(filters)
    }, 450)
    return () => { if(debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters])

  async function loadStats(f){
    setLoading(true)
    setError(null)
    try{
      const res = await fetchStats(f)
      setData(res)
    }catch(err){
      setError(err)
    }finally{ setLoading(false) }
  }

  return { data, loading, error, filters, setFilters, reload: () => loadStats(filters) }
}
