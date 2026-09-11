"""
FleetManager Agent System - RAG (Retrieval Augmented Generation)
================================================================
Vector database using ChromaDB for storing and querying:
- Database schemas (tables, columns, relationships)
- Business rules and regulations
- Known error patterns and solutions
- Operational procedures
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from chromadb import PersistentClient, Collection
from chromadb.config import Settings
from config import config
from core.agent_logger import agent_logger


class RAGSystem:
    """Vector database for FleetManager domain knowledge.

    Stores embeddings of:
    - Database table schemas (columns, types, relationships)
    - Business rules (RH, financial, operational)
    - Document templates and requirements
    - Known issues and resolutions
    """

    def __init__(self, collection_name: Optional[str] = None):
        self.log = agent_logger.get_logger("rag")
        self.cfg = config.rag

        # Ensure persist directory exists
        persist_dir = Path(self.cfg.persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client
        self.client = PersistentClient(
            path=str(persist_dir),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )

        # Get or create collection
        name = collection_name or self.cfg.collection_name
        try:
            self.collection = self.client.get_collection(name)
            self.log.info(f"Loaded existing collection: {name} ({self.collection.count()} docs)")
        except (ValueError, Exception):
            self.collection = self.client.create_collection(
                name=name,
                metadata={"description": "FleetManager Domain Knowledge", "created": str(datetime.now())},
            )
            self.log.info(f"Created new collection: {name}")

        self._initialized = False

    # ── Document Management ──────────────────────────────────

    def add_document(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        doc_id: Optional[str] = None,
    ) -> str:
        """Add a single document to the vector store."""

        doc_id = doc_id or f"doc_{datetime.now().timestamp()}_{hash(content) % 10000}"

        self.collection.add(
            documents=[content],
            metadatas=[metadata or {}],
            ids=[doc_id],
        )
        self.log.debug(f"📄 Added document: {doc_id}")
        return doc_id

    def add_documents(
        self,
        documents: List[Dict[str, Any]],
    ) -> List[str]:
        """Add multiple documents at once.

        Each document dict should have:
            - content (str): The text content
            - metadata (dict): Optional metadata
            - id (str): Optional ID (generated if not provided)
        """
        ids = []
        contents = []
        metadatas = []

        for doc in documents:
            content = doc.get("content", "")
            if not content.strip():
                continue

            contents.append(content)
            metadatas.append(doc.get("metadata", {}))
            doc_id = doc.get("id") or f"doc_{datetime.now().timestamp()}_{hash(content) % 10000}"
            ids.append(doc_id)

        if contents:
            self.collection.add(
                documents=contents,
                metadatas=metadatas,
                ids=ids,
            )
            self.log.info(f"📚 Added {len(contents)} documents to RAG")

        return ids

    def query(self, query_text: str, k: int = 5) -> List[Dict[str, Any]]:
        """Query the vector store for relevant documents."""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=min(k, self.collection.count() or 1),
        )

        documents = []
        if results["documents"]:
            for i, content in enumerate(results["documents"][0]):
                documents.append({
                    "content": content,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "id": results["ids"][0][i],
                    "distance": results["distances"][0][i] if results.get("distances") else 0,
                })

        return documents

    def count(self) -> int:
        """Return total number of documents in the collection."""
        return self.collection.count()

    def delete_collection(self) -> None:
        """Delete the entire collection and recreate it."""
        name = self.collection.name
        self.client.delete_collection(name)
        self.collection = self.client.create_collection(name)
        self.log.warning(f"🗑️ Collection '{name}' deleted and recreated")

    # ── Seed Initial Knowledge ────────────────────────────────

    def seed_knowledge_base(self) -> int:
        """Seed the RAG with initial FleetManager knowledge.
        Returns the number of documents added.
        """
        from .schema_knowledge import SchemaKnowledge

        seeder = SchemaKnowledge(self)
        count = seeder.seed_all()
        self._initialized = True
        self.log.info(f"🌱 Knowledge base seeded with {count} documents")
        return count



