/**
 * Admin eWAY Transaction Service
 * Handles all transaction-related operations for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminEwayTransactionService {
  /**
   * Get transaction overview for admin dashboard
   */
  async getOverview(timeframe: string) {
    const dateFilter = this.getDateFilter(timeframe);

    const [
      transactionStats,
      revenueStats,
      statusDistribution,
      recentTransactions
    ] = await Promise.all([
      // Transaction volume stats
      prisma.ewayTransaction.aggregate({
        _count: { id: true },
        _sum: { amount: true },
        where: {
          createdAt: { gte: dateFilter }
        }
      }),
      // Revenue by status
      prisma.ewayTransaction.groupBy({
        by: ['transactionStatus'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: dateFilter }
        }
      }),
      // Status distribution
      prisma.ewayTransaction.groupBy({
        by: ['transactionStatus'],
        _count: { id: true },
        where: {
          createdAt: { gte: dateFilter }
        }
      }),
      // Recent transactions
      prisma.ewayTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: { gte: dateFilter }
        },
        include: {
          workspace: {
            select: { name: true }
          }
        }
      })
    ]);

    return {
      statistics: {
        totalTransactions: transactionStats._count.id || 0,
        totalRevenue: transactionStats._sum.amount || 0,
        averageTransaction: transactionStats._count.id 
          ? (transactionStats._sum.amount || 0) / transactionStats._count.id 
          : 0
      },
      revenueByStatus: revenueStats.map(stat => ({
        status: stat.transactionStatus,
        revenue: stat._sum.amount || 0,
        count: stat._count.id
      })),
      statusDistribution: statusDistribution.map(stat => ({
        status: stat.transactionStatus,
        count: stat._count.id
      })),
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.transactionStatus,
        workspaceName: transaction.workspace?.name || 'Unknown',
        createdAt: transaction.createdAt,
        ewayTransactionId: transaction.ewayTransactionId
      }))
    };
  }

  /**
   * Get paginated list of transactions with filtering
   */
  async getTransactions(queryParams: any) {
    const {
      page = 1,
      limit = 20,
      status,
      workspaceId,
      startDate,
      endDate,
      search
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.transactionStatus = status;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { ewayTransactionId: { contains: search, mode: 'insensitive' } },
        { workspace: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.ewayTransaction.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.ewayTransaction.count({ where })
    ]);

    return {
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        ewayTransactionId: transaction.ewayTransactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.transactionStatus,
        paymentMethod: transaction.paymentMethod,
        workspace: transaction.workspace,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        responseCode: transaction.responseCode,
        responseMessage: transaction.responseMessage
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
   * Get date filter based on timeframe
   */
  private getDateFilter(timeframe: string): Date {
    switch (timeframe) {
      case '7days':
        return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      case '1year':
        return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}