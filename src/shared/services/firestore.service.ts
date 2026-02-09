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
  transactions: {
    async getAll(userId: string) {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
      }));
    },

    async create(userId: string, transaction: any) {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId,
        date: Timestamp.fromDate(new Date(transaction.date)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { id: docRef.id, ...transaction };
    },

    async delete(transactionId: string) {
      await deleteDoc(doc(db, 'transactions', transactionId));
    },

    async getStatistics(userId: string) {
      const transactions = await this.getAll(userId);
      
      let totalIncome = 0;
      let totalExpenses = 0;
      
      transactions.forEach((txn: any) => {
        if (txn.category.startsWith('income_')) {
          totalIncome += parseFloat(txn.amount);
        } else {
          totalExpenses += parseFloat(txn.amount);
        }
      });
      
      return {
        totalIncome,
        totalExpenses,
        netCashflow: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      };
    },
  },
};