import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { type Fields, type Files } from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const uploadDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

  const form = formidable({ multiples: true, uploadDir, keepExtensions: true })

  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' })
    }
    // TODO: parse files server-side and index into a vector store
    return res.status(200).json({ success: true, files })
  })
}
