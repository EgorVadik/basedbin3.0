'use server'

import { getServerAuthSession } from './server/auth'
import { prisma } from './server/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Chat } from './types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const createFile = async (fileName: string, parentId?: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to create a file',
            data: null,
        }

    try {
        const file = await prisma.folder.create({
            data: {
                isFolder: false,
                name: fileName,
                parentId,
                extension:
                    fileName.split('.').length >= 2
                        ? fileName.split('.').pop()
                        : 'md',
                userIds: {
                    set: [session.user.id],
                },
            },
        })

        return {
            error: null,
            data: file,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}

export const createFolder = async (folderName: string, parentId?: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to create a folder',
            data: null,
        }

    try {
        const folder = await prisma.folder.create({
            data: {
                isFolder: true,
                name: folderName,
                parentId,
                userIds: {
                    set: [session.user.id],
                },
            },
        })

        return {
            error: null,
            data: folder,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}

export const deleteFile = async (fileId: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to delete a file',
            data: null,
        }

    try {
        const file = await prisma.folder.findUnique({
            where: {
                id: fileId,
            },
        })

        if (!file)
            return {
                error: 'File not found',
                data: null,
            }

        const filteredIds = file.userIds.filter((id) => id !== session.user.id)

        if (filteredIds.length === 0) {
            await prisma.folder.delete({
                where: {
                    id: fileId,
                },
            })
        } else {
            await prisma.folder.update({
                where: {
                    id: fileId,
                },
                data: {
                    userIds: {
                        set: filteredIds,
                    },
                },
            })
        }

        return {
            error: null,
            data: file,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}

export const joinFile = async (fileId: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to join a file',
            data: null,
        }

    try {
        const file = await prisma.folder.update({
            where: {
                id: fileId,
            },
            data: {
                userIds: {
                    push: session.user.id,
                },
            },
        })

        return {
            error: null,
            data: file,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}

export const chatWithBard = async (history: Chat[], message: string) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const chat = model.startChat({
        history,
    })

    const result = await chat.sendMessage(message)
    return result.response.text()
}

export const saveContent = async (fileId: string, content: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to save a file',
            data: null,
        }

    try {
        const file = await prisma.folder.update({
            where: {
                id: fileId,
            },
            data: {
                content,
            },
        })

        return {
            error: null,
            data: file,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}

export const reorderFile = async (fileId: string, parentId: string) => {
    const session = await getServerAuthSession()
    if (!session)
        return {
            error: 'Please login to reorder a file',
            data: null,
        }

    try {
        const file = await prisma.folder.update({
            where: {
                id: fileId,
            },
            data: {
                parentId,
            },
        })

        return {
            error: null,
            data: file,
        }
    } catch (error) {
        return {
            error: (error as Error).message,
            data: null,
        }
    }
}
