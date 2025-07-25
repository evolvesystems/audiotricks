/**
 * Admin eWAY Customer Service
 * Handles customer and recurring payment operations for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminEwayCustomerService {
  /**
   * Get paginated list of eWAY customers
   */
  async getCustomers(queryParams: any) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      hasRecurring
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (hasRecurring === 'true') {
      where.recurringSchedules = {
        some: {}
      };
    }

    if (search) {
      where.OR = [
        { customerReference: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { workspace: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.ewayCustomer.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              transactions: true,
              recurringSchedules: true
            }
          }
        }
      }),
      prisma.ewayCustomer.count({ where })
    ]);

    return {
      customers: customers.map(customer => ({
        id: customer.id,
        customerReference: customer.customerReference,
        email: customer.email,
        status: customer.status,
        workspace: customer.workspace,
        transactionCount: customer._count.transactions,
        recurringCount: customer._count.recurringSchedules,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get recurring payment schedules
   */
  async getRecurringSchedules(queryParams: any) {
    const {
      page = 1,
      limit = 20,
      status,
      frequency,
      workspaceId
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (workspaceId) {
      where.customer = {
        workspaceId: workspaceId
      };
    }

    const [schedules, total] = await Promise.all([
      prisma.ewayRecurringSchedule.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: {
              workspace: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: {
              payments: true
            }
          }
        }
      }),
      prisma.ewayRecurringSchedule.count({ where })
    ]);

    return {
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        amount: schedule.amount,
        frequency: schedule.frequency,
        status: schedule.status,
        nextPaymentDate: schedule.nextPaymentDate,
        customer: {
          id: schedule.customer.id,
          email: schedule.customer.email,
          workspace: schedule.customer.workspace
        },
        paymentCount: schedule._count.payments,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }
}