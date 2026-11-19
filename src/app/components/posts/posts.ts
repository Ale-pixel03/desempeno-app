import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs/operators';
import { Post } from '../../models/post';
import { PostService } from '../../services/post';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.html'
})
export class Posts implements OnInit {
  posts: Post[] = [];
  newTitle: string = '';
  newBody: string = '';
  loading: boolean = false;
  errorMsg: string = '';

  editingPostId: number | null = null;
  editTitle: string = '';
  editBody: string = '';

  constructor(
    private postService: PostService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.errorMsg = '';

    this.postService.getPosts().pipe(timeout(6000)).subscribe({
      next: (data) => {
        this.posts = data.slice(0, 20);
        this.loading = false;
        this.cdr.detectChanges(); // Fuerza la actualización visual inmediata
      },
      error: (err) => {
        console.error('Error al cargar publicaciones:', err);
        this.loading = false;
        this.errorMsg = 'No se pudo conectar con JSONPlaceholder. Revisa tu conexión o red.';
        this.cdr.detectChanges();
      }
    });
  }

  addPost(): void {
    if (!this.newTitle.trim() || !this.newBody.trim()) return;

    const postData: Post = {
      userId: 1,
      title: this.newTitle.trim(),
      body: this.newBody.trim()
    };

    this.postService.createPost(postData).subscribe({
      next: (created) => {
        const newPost: Post = {
          ...created,
          id: Date.now()
        };
        this.posts.unshift(newPost);
        this.newTitle = '';
        this.newBody = '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al crear publicación:', err)
    });
  }

  startEdit(post: Post): void {
    this.editingPostId = post.id ?? null;
    this.editTitle = post.title;
    this.editBody = post.body;
  }

  cancelEdit(): void {
    this.editingPostId = null;
    this.editTitle = '';
    this.editBody = '';
  }

  saveEdit(post: Post): void {
    if (!this.editTitle.trim() || !this.editBody.trim() || post.id === undefined) return;

    const updatedData: Post = {
      ...post,
      title: this.editTitle.trim(),
      body: this.editBody.trim()
    };

    const apiId = post.id > 100 ? 1 : post.id;

    this.postService.updatePost(apiId, updatedData).subscribe({
      next: () => {
        const index = this.posts.findIndex((p) => p.id === post.id);
        if (index !== -1) {
          this.posts[index] = { ...updatedData };
        }
        this.cancelEdit();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al actualizar publicación:', err)
    });
  }

  deletePost(id?: number): void {
    if (id === undefined) return;

    const apiId = id > 100 ? 1 : id;

    this.postService.deletePost(apiId).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.id !== id);
        if (this.editingPostId === id) {
          this.cancelEdit();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al eliminar publicación:', err)
    });
  }
}