import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const firestoreService = {
  // Transactions
  transactions: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          };
        });
      } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
      }
    },

    async create(userId: string, transaction: any) {
      try {
        const docRef = await addDoc(collection(db, 'transactions'), {
          ...transaction,
          userId,
          date: Timestamp.fromDate(new Date(transaction.date)),
          amount: parseFloat(transaction.amount),
          receiptUrl: transaction.receiptUrl || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...transaction };
      } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
      }
    },

    async delete(transactionId: string) {
      try {
        await deleteDoc(doc(db, 'transactions', transactionId));
      } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }
    },

    async getStatistics(userId: string) {
      try {
        const transactions = await this.getAll(userId);
        
        let totalIncome = 0;
        let totalExpenses = 0;
        
        transactions.forEach((txn: any) => {
          const amount = parseFloat(txn.amount) || 0;
          if (txn.category.startsWith('income_')) {
            totalIncome += amount;
          } else {
            totalExpenses += amount;
          }
        });
        
        return {
          totalIncome,
          totalExpenses,
          netCashflow: totalIncome - totalExpenses,
          transactionCount: transactions.length,
        };
      } catch (error) {
        console.error('Error getting statistics:', error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netCashflow: 0,
          transactionCount: 0,
        };
      }
    },
  },

  // Savings Goals
  savingsGoals: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'savings_goals'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error('Error getting savings goals:', error);
        return [];
      }
    },

    async create(userId: string, goal: any) {
      try {
        const docRef = await addDoc(collection(db, 'savings_goals'), {
          ...goal,
          userId,
          targetAmount: parseFloat(goal.targetAmount),
          currentAmount: parseFloat(goal.currentAmount || 0),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...goal };
      } catch (error) {
        console.error('Error creating savings goal:', error);
        throw error;
      }
    },

    async update(goalId: string, currentAmount: number) {
      try {
        await updateDoc(doc(db, 'savings_goals', goalId), {
          currentAmount: parseFloat(currentAmount.toString()),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating savings goal:', error);
        throw error;
      }
    },

    async delete(goalId: string) {
      try {
        await deleteDoc(doc(db, 'savings_goals', goalId));
      } catch (error) {
        console.error('Error deleting savings goal:', error);
        throw error;
      }
    },
  },

  // Investments
  investments: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'investments'),
          where('userId', '==', userId),
          orderBy('purchaseDate', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate),
          };
        });
      } catch (error) {
        console.error('Error getting investments:', error);
        return [];
      }
    },

    async create(userId: string, investment: any) {
      try {
        const docRef = await addDoc(collection(db, 'investments'), {
          ...investment,
          userId,
          principalAmount: parseFloat(investment.principalAmount),
          currentValue: parseFloat(investment.currentValue),
          purchaseDate: Timestamp.fromDate(new Date(investment.purchaseDate)),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...investment };
      } catch (error) {
        console.error('Error creating investment:', error);
        throw error;
      }
    },

    async update(investmentId: string, currentValue: number) {
      try {
        await updateDoc(doc(db, 'investments', investmentId), {
          currentValue: parseFloat(currentValue.toString()),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating investment:', error);
        throw error;
      }
    },

    async delete(investmentId: string) {
      try {
        await deleteDoc(doc(db, 'investments', investmentId));
      } catch (error) {
        console.error('Error deleting investment:', error);
        throw error;
      }
    },

    async getStatistics(userId: string) {
      try {
        const investments = await this.getAll(userId);
        
        let totalInvested = 0;
        let totalValue = 0;
        
        investments.forEach((inv: any) => {
          totalInvested += parseFloat(inv.principalAmount) || 0;
          totalValue += parseFloat(inv.currentValue) || 0;
        });
        
        return {
          totalInvested,
          totalValue,
          totalGainLoss: totalValue - totalInvested,
          investmentCount: investments.length,
        };
      } catch (error) {
        console.error('Error getting investment statistics:', error);
        return {
          totalInvested: 0,
          totalValue: 0,
          totalGainLoss: 0,
          investmentCount: 0,
        };
      }
    },
  },

  // Budgets
  budgets: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'budgets'),
          where('userId', '==', userId)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
          };
        });
      } catch (error) {
        console.error('Error getting budgets:', error);
        return [];
      }
    },

    async create(userId: string, budget: any) {
      try {
        const docRef = await addDoc(collection(db, 'budgets'), {
          ...budget,
          userId,
          limit: parseFloat(budget.limit),
          startDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...budget };
      } catch (error) {
        console.error('Error creating budget:', error);
        throw error;
      }
    },

    async delete(budgetId: string) {
      try {
        await deleteDoc(doc(db, 'budgets', budgetId));
      } catch (error) {
        console.error('Error deleting budget:', error);
        throw error;
      }
    },
  },

  // Recurring Transactions
  recurring: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'recurring_transactions'),
          where('userId', '==', userId)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : null,
            nextDate: data.nextDate?.toDate ? data.nextDate.toDate() : new Date(data.nextDate),
            lastProcessed: data.lastProcessed?.toDate ? data.lastProcessed.toDate() : null,
          };
        });
      } catch (error) {
        console.error('Error getting recurring transactions:', error);
        return [];
      }
    },

    async create(userId: string, recurring: any) {
      try {
        const startDate = Timestamp.fromDate(new Date(recurring.startDate));
        const nextDate = Timestamp.fromDate(new Date(recurring.startDate));
        
        const docRef = await addDoc(collection(db, 'recurring_transactions'), {
          ...recurring,
          userId,
          startDate,
          nextDate,
          endDate: recurring.endDate ? Timestamp.fromDate(new Date(recurring.endDate)) : null,
          lastProcessed: null,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...recurring };
      } catch (error) {
        console.error('Error creating recurring transaction:', error);
        throw error;
      }
    },

    async toggleActive(recurringId: string, active: boolean) {
      try {
        await updateDoc(doc(db, 'recurring_transactions', recurringId), {
          active,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error toggling recurring transaction:', error);
        throw error;
      }
    },

    async delete(recurringId: string) {
      try {
        await deleteDoc(doc(db, 'recurring_transactions', recurringId));
      } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        throw error;
      }
    },
  },

  // Calendar Events
  calendarEvents: {
    async getAll(userId: string) {
      try {
        const q = query(
          collection(db, 'calendar_events'),
          where('userId', '==', userId),
          orderBy('date', 'asc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : data.date,
          };
        });
      } catch (error) {
        console.error('Error getting calendar events:', error);
        return [];
      }
    },

    async create(userId: string, event: any) {
      try {
        const docRef = await addDoc(collection(db, 'calendar_events'), {
          ...event,
          userId,
          date: Timestamp.fromDate(new Date(event.date)),
          expectedAmount: event.expectedAmount ? parseFloat(event.expectedAmount) : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        return { id: docRef.id, ...event };
      } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
      }
    },

    async update(eventId: string, updates: any) {
      try {
        const updateData: any = {
          ...updates,
          updatedAt: serverTimestamp(),
        };
        
        if (updates.expectedAmount) {
          updateData.expectedAmount = parseFloat(updates.expectedAmount);
        }
        
        await updateDoc(doc(db, 'calendar_events', eventId), updateData);
      } catch (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }
    },

    async delete(eventId: string) {
      try {
        await deleteDoc(doc(db, 'calendar_events', eventId));
      } catch (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
    },
  },
};