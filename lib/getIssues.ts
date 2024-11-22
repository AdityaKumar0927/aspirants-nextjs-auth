// app/lib/getIssues.ts

export async function getIssues() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/issues`, {
      cache: 'no-store', // or 'force-cache' for static data
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch issues')
    }
  
    return res.json()
  }