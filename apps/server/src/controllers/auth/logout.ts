import express from 'express'

export const logout = async (req: express.Request, res: express.Response) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err)
        return res.status(500).send('Logout failed')
      }
      res.clearCookie('sessionId')
      return res.status(200).send('Logged out')
    })
  } catch (e) {
    console.error('Unexpected error:', e)
    res.status(500).send('Unexpected error during logout')
  }
}
