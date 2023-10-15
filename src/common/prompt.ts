import type { QuestionCollection } from 'inquirer'
import type { cli } from 'cli-ux'
import { getContext } from './context'

export const maybePrompt = async <T>(questions: QuestionCollection<T>, initialAnswers?: Partial<T>): Promise<T> => {
  const context = getContext()

  if (context.flags?.interactive !== false) {
    const inquirer = await import('inquirer')
    return inquirer.prompt<T>(questions, initialAnswers)
  }

  // instead return default values without prompting
  const defaultValues = {} as T;

  const questionsArray = Array.isArray(questions) ? questions : [questions]
  questionsArray.forEach((question) => {
    if (question.name && question.default !== undefined) {
      defaultValues[question.name] = question.default
    }
  })

  return defaultValues;
}

export const maybeSimplePrompt = async (...args: Parameters<typeof cli.prompt>) => {
  const context = getContext()

  if (context.flags?.interactive !== false) {
    const cli = await import('cli-ux')
    return cli.cli.prompt(...args)
  }

  return args[1]?.default ?? undefined
}